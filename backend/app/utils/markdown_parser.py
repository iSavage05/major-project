import re
import json
from typing import Dict, List, Any

def parse_materials_markdown(markdown_text: str) -> List[Dict[str, Any]]:
    """Parse materials markdown table into JSON format"""
    materials = []
    
    # Find the table in markdown
    lines = markdown_text.split('\n')
    in_table = False
    headers = []
    
    for line in lines:
        line = line.strip()
        
        # Check for table header
        if '|' in line and 'Description' in line:
            headers = [h.strip() for h in line.split('|')[1:-1]]
            in_table = True
            continue
            
        # Skip separator line
        if in_table and ':' in line and set(line.replace(':', '').replace('|', '').replace('-', '').replace(' ', '')) == set():
            continue
            
        # Parse table rows
        if in_table and '|' in line and headers:
            values = [v.strip() for v in line.split('|')[1:-1]]
            if len(values) == len(headers) and values[0]:  # Skip empty rows
                material = {}
                for i, header in enumerate(headers):
                    material[header.lower().replace(' ', '_').replace('/', '_')] = values[i]
                
                # Parse quantity to float if possible
                try:
                    material['qty'] = float(material.get('qty', 0))
                except (ValueError, TypeError):
                    pass
                
                materials.append(material)
    
    return materials

def parse_execution_plan_markdown(markdown_text: str) -> Dict[str, Any]:
    """Parse execution plan markdown into structured JSON"""
    plan = {
        'project_summary': '',
        'time_required': {},
        'categories': [],
        'phases': [],
        'labour': [],
        'material_usage': [],
        'site_notes': []
    }
    
    lines = markdown_text.split('\n')
    current_section = None
    table_headers = []
    
    for line in lines:
        line = line.strip()
        
        # Detect sections
        if line.startswith('##'):
            current_section = line[2:].strip().lower()
            if 'project summary' in current_section:
                current_section = 'project_summary'
            elif 'time required' in current_section:
                current_section = 'time_required'
            elif 'categories' in current_section:
                current_section = 'categories'
            elif 'phase-wise' in current_section:
                current_section = 'phases'
            elif 'labour required' in current_section:
                current_section = 'labour'
            elif 'material usage' in current_section:
                current_section = 'material_usage'
            elif 'site notes' in current_section:
                current_section = 'site_notes'
            continue
            
        # Parse content based on current section
        if current_section == 'project_summary':
            if line and not line.startswith('#'):
                plan['project_summary'] += line + ' '
                
        elif current_section == 'time_required':
            if '|' in line and 'Duration' in line:
                table_headers = [h.strip() for h in line.split('|')[1:-1]]
            elif '|' in line and table_headers and ':' not in line.replace('|', '').replace('-', '').replace(' ', ''):
                values = [v.strip() for v in line.split('|')[1:-1]]
                if len(values) == len(table_headers) and values[0]:
                    key = values[0].replace('**', '').strip()
                    plan['time_required'][key] = values[1].strip()
                    
        elif current_section == 'categories':
            if '|' in line and 'Category' in line:
                table_headers = [h.strip().lower() for h in line.split('|')[1:-1]]
            elif '|' in line and table_headers and ':' not in line.replace('|', '').replace('-', '').replace(' ', ''):
                values = [v.strip() for v in line.split('|')[1:-1]]
                if len(values) == len(table_headers) and values[0]:
                    category = {}
                    for i, header in enumerate(table_headers):
                        category[header] = values[i]
                    # Extract category name and days
                    category_name = category.get('category', values[0]).lower()
                    days_str = category.get('estimated days', category.get('days', '0'))
                    try:
                        days = float(days_str)
                    except:
                        days = 0
                    plan['categories'].append({
                        'category': category_name,
                        'days': days,
                        'notes': category.get('notes', '')
                    })
                    
        elif current_section == 'phases':
            if '|' in line and 'Phase' in line:
                table_headers = [h.strip().lower() for h in line.split('|')[1:-1]]
            elif '|' in line and table_headers and ':' not in line.replace('|', '').replace('-', '').replace(' ', ''):
                values = [v.strip() for v in line.split('|')[1:-1]]
                if len(values) == len(table_headers) and values[0]:
                    phase = {}
                    for i, header in enumerate(table_headers):
                        phase[header] = values[i]
                    plan['phases'].append(phase)
                    
        elif current_section == 'labour':
            if '|' in line and 'labour' in line.lower():
                table_headers = [h.strip().lower() for h in line.split('|')[1:-1]]
            elif '|' in line and table_headers and ':' not in line.replace('|', '').replace('-', '').replace(' ', ''):
                values = [v.strip() for v in line.split('|')[1:-1]]
                if len(values) == len(table_headers) and values[0]:
                    labour = {}
                    for i, header in enumerate(table_headers):
                        labour[header] = values[i]
                    plan['labour'].append(labour)
                    
        elif current_section == 'material_usage':
            if '|' in line and 'material' in line.lower():
                table_headers = [h.strip().lower() for h in line.split('|')[1:-1]]
            elif '|' in line and table_headers and ':' not in line.replace('|', '').replace('-', '').replace(' ', ''):
                values = [v.strip() for v in line.split('|')[1:-1]]
                if len(values) == len(table_headers) and values[0]:
                    material = {}
                    for i, header in enumerate(table_headers):
                        material[header] = values[i]
                    plan['material_usage'].append(material)
                    
        elif current_section == 'site_notes':
            if line and not line.startswith('#') and line not in ['*', '']:
                if line.startswith('*') or line.startswith('-'):
                    plan['site_notes'].append(line[1:].strip())
                elif line:
                    plan['site_notes'].append(line)
    
    # Clean up project summary
    plan['project_summary'] = plan['project_summary'].strip()
    
    return plan
