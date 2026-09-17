import yaml

def load_config(path='data/config.yaml'):
    with open(path, 'r') as f:
        return yaml.safe_load(f)