import io
import json
import math
import os
import re
import textwrap
from typing import Any, BinaryIO, Dict, Optional, Union

import google.generativeai as genai
from PIL import Image as PILImage
from PIL import UnidentifiedImageError


class VastuAIServiceError(Exception):
    """Base exception for the isolated Vastu AI integration."""


class VastuAIConfigurationError(VastuAIServiceError):
    """Raised when the AI provider is not configured."""


class VastuAIResponseError(VastuAIServiceError):
    """Raised when the AI provider response cannot be read or parsed."""


class VastuAIValidationError(VastuAIServiceError):
    """Raised when the parsed JSON does not match the public API schema."""


VASTU_SYSTEM_PROMPT = textwrap.dedent(
    """
    You are a senior Vastu Shastra consultant analyzing Indian residential and
    commercial floor plans from uploaded blueprint images.

    Return ONLY valid, minified JSON. Do not include Markdown, code fences,
    natural-language prefaces, citations, or comments.

    The JSON must match this exact schema:
    {"overall_compliance_score":number,"orientation_summary":"string","room_analysis":[{"room_name":"string","zone":"string","status":"Positive|Neutral|Critical","observation":"string","remedy":"string|null"}],"general_tips":["string"]}

    Rules:
    - overall_compliance_score must be a number from 0 to 100.
    - status must be exactly one of: Positive, Neutral, Critical.
    - remedy must be null when no remedy is needed.
    - Escape any quotation marks that appear inside string values.
    - Keep every string concise so the response is not truncated.
    - If the image does not clearly show north/orientation, state that in
      orientation_summary and base the analysis on visible labels and common
      assumptions.
    - Do not diagnose beyond what is visible in the uploaded floor plan.
    - Keep observations and remedies practical, concise, and non-alarmist.
    """
).strip()


JSON_REPAIR_SYSTEM_PROMPT = textwrap.dedent(
    """
    You repair malformed JSON. Return ONLY valid, minified JSON that matches
    the requested schema. Do not add Markdown, explanations, or code fences.
    """
).strip()


VASTU_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "overall_compliance_score": {"type": "number"},
        "orientation_summary": {"type": "string"},
        "room_analysis": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "room_name": {"type": "string"},
                    "zone": {"type": "string"},
                    "status": {"type": "string", "enum": ["Positive", "Neutral", "Critical"]},
                    "observation": {"type": "string"},
                    "remedy": {"type": "string", "nullable": True},
                },
                "required": ["room_name", "zone", "status", "observation", "remedy"],
            },
        },
        "general_tips": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "overall_compliance_score",
        "orientation_summary",
        "room_analysis",
        "general_tips",
    ],
}


class VastuAIService:
    """
    Entry point for Vastu floor-plan analysis.

    This service is intentionally independent from application models and
    databases. Controllers can pass uploaded image bytes or a readable stream
    directly to analyze_floor_plan().
    """

    VALID_STATUSES = {"Positive", "Neutral", "Critical"}
    MAX_IMAGE_BYTES = 16 * 1024 * 1024

    def __init__(self, model_name: Optional[str] = None):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise VastuAIConfigurationError("GEMINI_API_KEY environment variable is not set")

        genai.configure(api_key=api_key)
        self.model_name = model_name or os.environ.get("VASTU_GEMINI_MODEL", "gemini-2.5-flash")
        self.base_generation_config = {
            "temperature": 0.15,
            "top_p": 0.9,
            "max_output_tokens": 4096,
            "response_mime_type": "application/json",
        }
        self.generation_config = {
            **self.base_generation_config,
            "response_schema": VASTU_RESPONSE_SCHEMA,
        }

    def analyze_floor_plan(
        self,
        image_source: Union[bytes, bytearray, BinaryIO],
        mime_type: Optional[str] = None,
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze a floor plan image and return validated JSON-compatible data.

        Args:
            image_source: Raw image bytes or any file-like object with read().
            mime_type: Optional client-provided MIME type for logging/debugging.
            filename: Optional client-provided filename for logging/debugging.
        """
        image_bytes = self._read_image_bytes(image_source)
        floor_plan_image = self._load_image(image_bytes)

        try:
            model = genai.GenerativeModel(
                self.model_name,
                system_instruction=VASTU_SYSTEM_PROMPT,
            )
            response = self._generate_content(
                model,
                [
                    self._build_user_prompt(mime_type=mime_type, filename=filename),
                    floor_plan_image,
                ],
            )
        except Exception as exc:
            raise VastuAIResponseError(f"Vastu AI request failed: {exc}") from exc

        raw_text = self._extract_response_text(response)
        try:
            parsed_payload = self._parse_json_payload(raw_text)
            return self._validate_payload(parsed_payload)
        except (VastuAIResponseError, VastuAIValidationError) as exc:
            repaired_text = self._repair_json_with_ai(raw_text, exc)
            parsed_payload = self._parse_json_payload(repaired_text)
            return self._validate_payload(parsed_payload)

    def _generate_content(self, model: Any, contents: list) -> Any:
        """
        Generate content with schema enforcement, falling back for SDK versions
        that do not support every schema field.
        """
        try:
            return model.generate_content(contents, generation_config=self.generation_config)
        except Exception as exc:
            if not self._looks_like_schema_config_error(exc):
                raise
            return model.generate_content(contents, generation_config=self.base_generation_config)

    def _looks_like_schema_config_error(self, exc: Exception) -> bool:
        message = str(exc).lower()
        schema_markers = ("response_schema", "schema", "nullable", "generationconfig")
        return any(marker in message for marker in schema_markers)

    def _build_user_prompt(self, mime_type: Optional[str], filename: Optional[str]) -> str:
        context_bits = []
        if filename:
            context_bits.append(f"filename={filename}")
        if mime_type:
            context_bits.append(f"mime_type={mime_type}")

        context = ", ".join(context_bits) if context_bits else "uploaded floor plan image"
        return (
            "Analyze this floor plan image for Vastu compliance. "
            f"Image context: {context}. "
            "Return the strict JSON object only."
        )

    def _read_image_bytes(self, image_source: Union[bytes, bytearray, BinaryIO]) -> bytes:
        if isinstance(image_source, (bytes, bytearray)):
            image_bytes = bytes(image_source)
        elif hasattr(image_source, "read"):
            image_bytes = image_source.read()
        else:
            raise VastuAIValidationError("Image source must be bytes or a readable stream")

        if not image_bytes:
            raise VastuAIValidationError("Uploaded image is empty")

        if len(image_bytes) > self.MAX_IMAGE_BYTES:
            raise VastuAIValidationError("Uploaded image exceeds the 16MB limit")

        return image_bytes

    def _load_image(self, image_bytes: bytes) -> PILImage.Image:
        try:
            image = PILImage.open(io.BytesIO(image_bytes))
            image.load()
            return image.convert("RGB")
        except UnidentifiedImageError as exc:
            raise VastuAIValidationError("Uploaded file is not a valid image") from exc
        except Exception as exc:
            raise VastuAIValidationError(f"Unable to read uploaded image: {exc}") from exc

    def _extract_response_text(self, response: Any) -> str:
        try:
            text = getattr(response, "text", None)
            if text:
                return text.strip()
        except Exception:
            pass

        try:
            parts = response.candidates[0].content.parts
            text_parts = [part.text for part in parts if getattr(part, "text", None)]
            if text_parts:
                return "".join(text_parts).strip()
        except Exception as exc:
            raise VastuAIResponseError("AI response did not contain readable text") from exc

        raise VastuAIResponseError("AI response was empty")

    def _parse_json_payload(self, raw_text: str) -> Dict[str, Any]:
        if not raw_text:
            raise VastuAIResponseError("AI response was empty")

        candidates = [raw_text.strip()]
        fenced_match = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", raw_text.strip(), re.DOTALL)
        if fenced_match:
            candidates.append(fenced_match.group(1).strip())

        first_brace = raw_text.find("{")
        last_brace = raw_text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            candidates.append(raw_text[first_brace : last_brace + 1].strip())

        for candidate in list(candidates):
            repaired_candidate = self._repair_common_json_issues(candidate)
            if repaired_candidate != candidate:
                candidates.append(repaired_candidate)

        last_error = None
        for candidate in candidates:
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    return parsed
                raise VastuAIValidationError("AI JSON root must be an object")
            except json.JSONDecodeError as exc:
                last_error = exc

        raise VastuAIResponseError(f"AI response was not valid JSON: {last_error}")

    def _repair_common_json_issues(self, candidate: str) -> str:
        """
        Repair common LLM JSON slips without guessing domain content.

        This handles trailing commas, missing commas between object fields/items,
        smart quotes, and Python-style null/boolean literals. More ambiguous
        repairs are delegated to the JSON-only AI repair pass.
        """
        repaired = candidate.strip()
        translation = str.maketrans({
            "“": '"',
            "”": '"',
            "‘": "'",
            "’": "'",
        })
        repaired = repaired.translate(translation)
        repaired = re.sub(r"\bNone\b", "null", repaired)
        repaired = re.sub(r"\bTrue\b", "true", repaired)
        repaired = re.sub(r"\bFalse\b", "false", repaired)
        repaired = re.sub(r",\s*([}\]])", r"\1", repaired)
        repaired = re.sub(r"}\s*{", "},{", repaired)
        repaired = re.sub(
            r'(?<=[}\]"0-9])\s+(?="(?:overall_compliance_score|orientation_summary|room_analysis|room_name|zone|status|observation|remedy|general_tips)"\s*:)',
            ",",
            repaired,
        )
        repaired = re.sub(
            r'(?<=[}\]])\s+(?=[{\[])',
            ",",
            repaired,
        )
        return repaired

    def _repair_json_with_ai(self, raw_text: str, parse_error: Exception) -> str:
        repair_prompt = textwrap.dedent(
            f"""
            The following response was intended to be JSON for this exact schema:
            {json.dumps(VASTU_RESPONSE_SCHEMA, separators=(",", ":"))}

            It failed to parse or validate with this error:
            {parse_error}

            Repair the response into valid minified JSON. Preserve the Vastu
            observations and remedies where possible. If any field cannot be
            recovered, fill it with a concise neutral value that fits the schema.
            Use null for missing remedies.

            Malformed response:
            {raw_text[:12000]}
            """
        ).strip()

        try:
            model = genai.GenerativeModel(
                self.model_name,
                system_instruction=JSON_REPAIR_SYSTEM_PROMPT,
            )
            response = self._generate_content(model, [repair_prompt])
            return self._extract_response_text(response)
        except Exception as exc:
            raise VastuAIResponseError(
                f"AI response was not valid JSON and repair failed: {exc}"
            ) from exc

    def _validate_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        score = payload.get("overall_compliance_score")
        if isinstance(score, bool) or not isinstance(score, (int, float)) or not math.isfinite(float(score)):
            raise VastuAIValidationError("overall_compliance_score must be a finite number")

        normalized_score = float(score)
        if normalized_score < 0 or normalized_score > 100:
            raise VastuAIValidationError("overall_compliance_score must be between 0 and 100")

        orientation_summary = payload.get("orientation_summary")
        if not isinstance(orientation_summary, str) or not orientation_summary.strip():
            raise VastuAIValidationError("orientation_summary must be a non-empty string")

        room_analysis = payload.get("room_analysis")
        if not isinstance(room_analysis, list):
            raise VastuAIValidationError("room_analysis must be an array")

        general_tips = payload.get("general_tips")
        if not isinstance(general_tips, list) or not all(isinstance(tip, str) for tip in general_tips):
            raise VastuAIValidationError("general_tips must be an array of strings")

        normalized_rooms = [self._validate_room(room, index) for index, room in enumerate(room_analysis)]

        return {
            "overall_compliance_score": int(normalized_score)
            if normalized_score.is_integer()
            else round(normalized_score, 2),
            "orientation_summary": orientation_summary.strip(),
            "room_analysis": normalized_rooms,
            "general_tips": [tip.strip() for tip in general_tips if tip.strip()],
        }

    def _validate_room(self, room: Any, index: int) -> Dict[str, Any]:
        if not isinstance(room, dict):
            raise VastuAIValidationError(f"room_analysis[{index}] must be an object")

        room_name = self._required_string(room, "room_name", index)
        zone = self._required_string(room, "zone", index)
        status = self._required_string(room, "status", index)
        observation = self._required_string(room, "observation", index)

        if status not in self.VALID_STATUSES:
            raise VastuAIValidationError(
                f"room_analysis[{index}].status must be Positive, Neutral, or Critical"
            )

        remedy = room.get("remedy")
        if remedy is not None and not isinstance(remedy, str):
            raise VastuAIValidationError(f"room_analysis[{index}].remedy must be a string or null")

        normalized_remedy = remedy.strip() if isinstance(remedy, str) and remedy.strip() else None

        return {
            "room_name": room_name,
            "zone": zone,
            "status": status,
            "observation": observation,
            "remedy": normalized_remedy,
        }

    def _required_string(self, room: Dict[str, Any], key: str, index: int) -> str:
        value = room.get(key)
        if not isinstance(value, str) or not value.strip():
            raise VastuAIValidationError(f"room_analysis[{index}].{key} must be a non-empty string")
        return value.strip()
