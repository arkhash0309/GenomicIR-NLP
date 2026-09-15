# Pre-import torch before pytest assertion rewriting starts.
# On Windows, torch's DLL loading (c10.dll) fails when triggered during
# pytest's subprocess collection phase. Loading it here — at conftest import
# time, before any test module is imported — ensures the DLLs are resident.
try:
    import torch  # noqa: F401
except Exception:
    pass
