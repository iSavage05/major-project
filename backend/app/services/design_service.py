import os
import io
import textwrap
from pathlib import Path
import google.generativeai as genai
import PIL.Image
import requests
from app.utils.markdown_parser import parse_materials_markdown, parse_execution_plan_markdown

class DesignService:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        genai.configure(api_key=self.api_key)
        self.image_model_id = "gemini-2.5-flash-image"
        self.text_model_id = "gemini-2.5-flash"
    
    def generate_design(self, image_path: str, prompt: str) -> dict:
        """Generate interior design from room image"""
        try:
            base_image = PIL.Image.open(image_path)
            
            # Generate transformed image
            transformed_image = self._generate_transformed_image(base_image, prompt)
            if not transformed_image:
                raise Exception("Failed to generate transformed image")
            
            # Generate materials list
            materials_text = self._generate_materials_list(prompt, base_image, transformed_image)
            materials = parse_materials_markdown(materials_text)
            
            return {
                'success': True,
                'transformed_image': transformed_image,
                'materials': materials,
                'materials_text': materials_text
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_design_from_url(self, image_url: str, prompt: str) -> dict:
        """Generate interior design from room image URL"""
        try:
            # Download image from URL
            response = requests.get(image_url)
            response.raise_for_status()
            base_image = PIL.Image.open(io.BytesIO(response.content))
            
            # Generate transformed image
            transformed_image = self._generate_transformed_image(base_image, prompt)
            if not transformed_image:
                raise Exception("Failed to generate transformed image")
            
            # Generate materials list
            materials_text = self._generate_materials_list(prompt, base_image, transformed_image)
            materials = parse_materials_markdown(materials_text)
            
            return {
                'success': True,
                'transformed_image': transformed_image,
                'materials': materials,
                'materials_text': materials_text
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_transformed_image(self, base_image: PIL.Image.Image, prompt: str) -> PIL.Image.Image:
        """Generate transformed room image"""
        model = genai.GenerativeModel(self.image_model_id)
        response = model.generate_content([prompt, base_image])
        
        if response.parts and len(response.parts) > 0:
            for part in response.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    return PIL.Image.open(io.BytesIO(part.inline_data.data))
        
        return None
    
    def _generate_materials_list(self, prompt: str, base_image: PIL.Image.Image, 
                                 transformed_image: PIL.Image.Image) -> str:
        """Generate materials list from images"""
        materials_prompt = textwrap.dedent(f"""
            Create an approximate bill of materials required to execute the interior
            transformation described below.

            Transformation prompt:
            {prompt}

            Use an Indian invoice/material schedule style similar to:
            Description of Goods | HSN/SAC | Qty | Unit

            Requirements:
            - Infer the room type and required items from the transformation prompt.
            - Use the original and generated images to understand scale, visible
              furniture, finishes, fixtures, and the actual transformation.
            - Include only materials relevant to the requested transformation.
            - Include structural/interior work, furniture, finishes, electrical items,
              lighting, decor, hardware, fasteners, and installation consumables only
              when they are needed for the prompt or visible generated result.
            - Use practical product-style descriptions, not long sentences.
            - Use approximate Indian HSN/SAC codes where reasonable.
            - Quantities should be realistic for one room transformation.
            - Do not include prices.
            - Output only a Markdown table with these columns:
              Description of Goods | HSN/SAC | Qty | Unit

            Note: HSN/SAC and quantities are estimates and should be verified by the
            contractor/vendor before purchase.
        """).strip()
        
        model = genai.GenerativeModel(self.text_model_id)
        response = model.generate_content([
            materials_prompt,
            "Use the prompt and both images to create the material list.",
            "Original room image:",
            base_image,
            "Generated transformed room image:",
            transformed_image,
        ])
        
        return response.text.strip()
    
    def generate_execution_plan(self, materials_text: str, room_name: str, 
                               transformed_image: PIL.Image.Image = None) -> dict:
        """Generate execution plan from materials list"""
        try:
            plan_prompt = textwrap.dedent(f"""
                Create a practical execution plan for the interior transformation using
                the generated bill of materials below.

                Room/output name:
                {room_name}

                Bill of materials:
                {materials_text}

                Requirements:
                - Assume this is a single-room Indian residential interior execution.
                - Create a realistic work plan with time required, materials used, and
                  labour used.
                - Group the work into sequential phases.
                - Include dependencies, such as electrical rough-in before finishes and
                  furniture/cabinet installation after painting where applicable.
                - Mention parallel work where possible.
                - Use practical Indian site roles such as carpenter, electrician,
                  painter, helper, installer, and cleaner.
                - Do not include prices or costs.
                - Quantities and timelines are estimates and should be verified on site.

                Output in Markdown with exactly these sections:
                # Execution Plan - {room_name}
                ## Project Summary
                ## Time Required
                ## Phase-wise Work Plan
                ## Labour Required
                ## Material Usage Plan
                ## Site Notes and Assumptions

                Format Time Required as a compact table with total duration and major
                phase durations.

                Format Phase-wise Work Plan as a table with:
                Phase | Work | Materials Used | Labour Used | Estimated Time | Dependencies

                Format Labour Required as a table with:
                Labour Role | Headcount | Days Required | Main Responsibility

                Format Material Usage Plan as a table with:
                Material/Item | Qty | Unit | Used In Phase | Notes
            """).strip()
            
            contents = [plan_prompt]
            
            if transformed_image:
                contents.extend([
                    "Generated room image for visual context:",
                    transformed_image,
                ])
            
            model = genai.GenerativeModel(self.text_model_id)
            response = model.generate_content(contents)
            
            plan_text = response.text.strip()
            plan_data = parse_execution_plan_markdown(plan_text)
            
            return {
                'success': True,
                'plan_text': plan_text,
                'plan_data': plan_data
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
