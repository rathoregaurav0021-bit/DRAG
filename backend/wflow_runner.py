import csv
import io
from typing import List, Dict

def calculate_runoff(rainfall_csv_content: str, curve_number: float = 75.0) -> List[Dict[str, float]]:
    """
    Simulates Wflow hydrology routing using the SCS-CN method.
    Takes a CSV string with 'time' and 'precipitation' columns.
    Returns a list of dicts containing time, precipitation, and the calculated surface discharge (runoff).
    """
    # S = potential maximum retention (in mm)
    S = (25400.0 / curve_number) - 254.0
    
    # Ia = Initial abstraction (water absorbed by dry soil/plants before any runoff begins)
    Ia = 0.2 * S  
    
    reader = csv.DictReader(io.StringIO(rainfall_csv_content))
    
    cumulative_P = 0.0
    cumulative_Q = 0.0
    results = []
    
    for row in reader:
        time_val = float(row.get('time', 0))
        # Handle cases where column might be named 'precipitation' or 'rainfall'
        p_val = row.get('precipitation', row.get('rainfall', 0))
        P_inc = float(p_val)
        
        cumulative_P += P_inc
        
        # Calculate cumulative Runoff (Q) using the SCS-CN formula
        if cumulative_P > Ia:
            Q_total = ((cumulative_P - Ia) ** 2) / (cumulative_P - Ia + S)
        else:
            Q_total = 0.0
            
        # Incremental runoff for this specific hour (the 'Discharge')
        Q_inc = Q_total - cumulative_Q
        Q_inc = max(0.0, Q_inc) # Prevent negative rounding errors
        
        cumulative_Q = Q_total
        
        results.append({
            'time': time_val,
            'precipitation': P_inc,
            'discharge': round(Q_inc, 2)
        })
        
    return results

if __name__ == "__main__":
    # Quick test if run directly
    sample_csv = "time,precipitation\n0,0\n1,5\n2,20\n3,50\n4,100"
    print(calculate_runoff(sample_csv))
