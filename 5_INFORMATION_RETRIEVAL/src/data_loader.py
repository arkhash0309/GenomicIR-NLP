import pandas as pd

def load_and_prepare_data(csv_path, content_fields):
    df = pd.read_csv(csv_path)
    
    # Combine selected fields into one content string
    df['content'] = df[content_fields].fillna('').agg('. '.join, axis=1)
    
    return df