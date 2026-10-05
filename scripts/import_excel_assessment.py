import sys
import json
import os
import re
from datetime import datetime, date

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import openpyxl

# Grid column ranges for 25 repertoires in sheet 'Tổng hợp'
REP_GRID_CONFIG = {
    'A': {'start_col': 2, 'max_items': 19},
    'B': {'start_col': 8, 'max_items': 27},
    'C': {'start_col': 14, 'max_items': 57},
    'D': {'start_col': 20, 'max_items': 27},
    'E': {'start_col': 26, 'max_items': 20},
    'F': {'start_col': 32, 'max_items': 29},
    'G': {'start_col': 38, 'max_items': 47},
    'H': {'start_col': 44, 'max_items': 49},
    'I': {'start_col': 50, 'max_items': 9},
    'J': {'start_col': 56, 'max_items': 20},
    'K': {'start_col': 62, 'max_items': 15},
    'L': {'start_col': 68, 'max_items': 34},
    'M': {'start_col': 74, 'max_items': 12},
    'N': {'start_col': 80, 'max_items': 10},
    'P': {'start_col': 86, 'max_items': 6},
    'Q': {'start_col': 92, 'max_items': 17},
    'R': {'start_col': 98, 'max_items': 29},
    'S': {'start_col': 104, 'max_items': 10},
    'T': {'start_col': 110, 'max_items': 7},
    'U': {'start_col': 116, 'max_items': 15},
    'V': {'start_col': 122, 'max_items': 10},
    'W': {'start_col': 128, 'max_items': 7},
    'X': {'start_col': 134, 'max_items': 10},
    'Y': {'start_col': 140, 'max_items': 30},
    'Z': {'start_col': 146, 'max_items': 28},
}

def format_date_str(val):
    if not val:
        return ''
    if isinstance(val, (datetime, date)):
        return val.strftime('%Y-%m-%d')
    s = str(val).strip()
    m_iso = re.search(r'\b\d{4}-\d{2}-\d{2}\b', s)
    if m_iso:
        return m_iso.group(0)
    m_vn = re.search(r'\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b', s)
    if m_vn:
        d, m, y = m_vn.groups()
        return f"{y}-{int(m):02d}-{int(d):02d}"
    return s

def parse_excel_assessment(excel_path):
    if not os.path.exists(excel_path):
        return {"error": f"Tệp không tồn tại: {excel_path}"}

    # Load skills master dataset
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, '..', 'src', 'data', 'ablls_master_dataset.json')
    if not os.path.exists(dataset_path):
        dataset_path = os.path.join(script_dir, '..', 'data', 'ablls_master_dataset.json')

    skills_map = {}
    if os.path.exists(dataset_path):
        with open(dataset_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            skills_map = {s['code']: s for s in data.get('skills', [])}

    wb = openpyxl.load_workbook(excel_path, data_only=True)
    summary_sheet_name = 'Tổng hợp' if 'Tổng hợp' in wb.sheetnames else wb.sheetnames[0]
    ws = wb[summary_sheet_name]

    # 1. Parse Student Metadata
    b4 = str(ws['B4'].value or ws['C4'].value or '')
    b6 = ws['B6'].value or ws['C6'].value or ''

    m_name = re.search(r'Họ\s*tên\s*:\s*([^(]+)(?:\(([^)]+)\))?', b4, re.IGNORECASE)
    if m_name:
        full_name = m_name.group(1).strip()
        nickname = m_name.group(2).strip() if m_name.group(2) else ''
    else:
        full_name = b4.replace('Họ tên :', '').strip()
        nickname = ''

    dob_formatted = format_date_str(b6)

    # 2. Parse Round Evaluators and Dates
    round_meta = {}
    for r_num in [1, 2, 3, 4]:
        r_idx = 9 + r_num
        assessor = ws.cell(r_idx, 2).value or ''
        dt_val = ws.cell(r_idx, 5).value or ''
        round_meta[r_num] = {
            'assessor_name': str(assessor).strip() if assessor else 'Giáo viên can thiệp',
            'assessment_date': format_date_str(dt_val) or datetime.now().strftime('%Y-%m-%d')
        }

    # 3. Parse Notes from Repertoire Sheets
    notes_map = {}
    for sheet_name in wb.sheetnames:
        if sheet_name in ['Tổng hợp', 'Mốc 2 tuổi', 'Mốc 3 tuổi', 'Mốc 4 tuổi', 'Mốc 5 tuổi', 'Mốc tuổi chuẩn (Norms)']:
            continue
        ind_ws = wb[sheet_name]
        for r in range(2, 120):
            code_val = ind_ws.cell(r, 1).value
            if code_val and isinstance(code_val, str) and re.match(r'^[A-Z]\d+$', code_val.strip()):
                code = code_val.strip()
                note_val = ind_ws.cell(r, 9).value
                if note_val and str(note_val).strip():
                    notes_map[code] = str(note_val).strip()

    # 4. Parse 25 Repertoires Matrix on Sheet 'Tổng hợp'
    skill_rounds = {}  # skill_code -> { level_str: round_num }

    for rep_code, config in REP_GRID_CONFIG.items():
        start_col = config['start_col']
        max_items = config['max_items']

        for item_idx in range(1, max_items + 1):
            code = f"{rep_code}{item_idx}"
            skill = skills_map.get(code, {'max_score': 1})
            max_score = skill.get('max_score', 1)
            row = 60 - (item_idx - 1)

            for lvl in range(1, max_score + 1):
                if max_score == 4:
                    offset = lvl - 1
                elif max_score == 2:
                    offset = (lvl - 1) * 2
                else:
                    offset = 0

                cell_val = ws.cell(row, start_col + offset).value
                if cell_val is not None:
                    try:
                        r_num = int(float(str(cell_val).strip()))
                        if 1 <= r_num <= 4:
                            skill_rounds.setdefault(code, {})[str(lvl)] = r_num
                    except (ValueError, TypeError):
                        pass

    # 5. Build Cumulative Sessions for Rounds 1..4
    rounds_result = []
    # Identify which rounds have data
    detected_rounds = set()
    for code, levels in skill_rounds.items():
        for lvl_str, r_num in levels.items():
            detected_rounds.add(r_num)

    if not detected_rounds:
        detected_rounds.add(1)

    for r_num in range(1, 5):
        # Only include rounds that have evaluated data or are round 1
        if r_num not in detected_rounds and r_num > max(detected_rounds, default=1):
            continue

        round_scores = {}
        round_skill_rounds = {}
        total_points = 0

        for code, levels in skill_rounds.items():
            achieved_count = 0
            code_level_rounds = {}
            for lvl_str, achieved_round in levels.items():
                if achieved_round <= r_num:
                    achieved_count += 1
                    code_level_rounds[lvl_str] = achieved_round

            if achieved_count > 0:
                round_scores[code] = achieved_count
                round_skill_rounds[code] = code_level_rounds
                total_points += achieved_count

        meta = round_meta.get(r_num, {})
        rounds_result.append({
            'roundNumber': r_num,
            'assessorName': meta.get('assessor_name', 'Giáo viên can thiệp'),
            'assessmentDate': meta.get('assessment_date', datetime.now().strftime('%Y-%m-%d')),
            'scores': round_scores,
            'skillRounds': round_skill_rounds,
            'notes': notes_map,
            'totalSkillsScored': len(round_scores),
            'totalPoints': total_points
        })

    return {
        'student': {
            'fullName': full_name or 'Học sinh từ Excel',
            'nickname': nickname,
            'dob': dob_formatted or '2022-01-01'
        },
        'rounds': rounds_result
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: python import_excel_assessment.py <excel_file>'}))
        sys.exit(1)

    res = parse_excel_assessment(sys.argv[1])
    print(json.dumps(res, ensure_ascii=False))
