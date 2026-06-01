from flask import Blueprint, current_app, jsonify, request
from werkzeug.utils import secure_filename

from app.services.vastu_ai_service import (
    VastuAIConfigurationError,
    VastuAIResponseError,
    VastuAIService,
    VastuAIServiceError,
    VastuAIValidationError,
)


vastu_bp = Blueprint("vastu", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/webp"}


def _allowed_image(file_storage) -> bool:
    filename = secure_filename(file_storage.filename or "")
    extension = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    mime_type = (file_storage.mimetype or "").lower()
    return extension in ALLOWED_EXTENSIONS or mime_type in ALLOWED_MIME_TYPES


@vastu_bp.route("/analyze", methods=["POST"])
def analyze_vastu_floor_plan():
    """
    POST /api/vastu/analyze

    Isolated multipart/form-data endpoint for Vastu floor-plan analysis.
    Expected form field: image

    This route intentionally does not read or write application database models.
    """
    uploaded_file = request.files.get("image") or request.files.get("floor_plan")

    if uploaded_file is None:
        return jsonify({"error": "No image file provided. Use multipart field 'image'."}), 400

    if not uploaded_file.filename:
        return jsonify({"error": "No file selected"}), 400

    if not _allowed_image(uploaded_file):
        return jsonify({"error": "Invalid file type. Allowed types: png, jpg, jpeg, webp"}), 400

    image_bytes = uploaded_file.read()

    try:
        result = VastuAIService().analyze_floor_plan(
            image_bytes,
            mime_type=uploaded_file.mimetype,
            filename=secure_filename(uploaded_file.filename),
        )
        return jsonify(result), 200
    except VastuAIConfigurationError as exc:
        current_app.logger.exception("Vastu AI service is not configured")
        return jsonify({"error": "Vastu AI service is not configured", "detail": str(exc)}), 503
    except VastuAIValidationError as exc:
        return jsonify({"error": str(exc)}), 400
    except VastuAIResponseError as exc:
        current_app.logger.exception("Vastu AI provider returned an invalid response")
        return jsonify({"error": "AI provider returned an invalid Vastu response", "detail": str(exc)}), 502
    except VastuAIServiceError as exc:
        current_app.logger.exception("Vastu AI service failed")
        return jsonify({"error": "Vastu analysis failed", "detail": str(exc)}), 500
    except Exception as exc:
        current_app.logger.exception("Unexpected Vastu analysis failure")
        return jsonify({"error": "Unexpected Vastu analysis failure", "detail": str(exc)}), 500
