import pandas as pd
import pickle
import base64
from django.conf import settings

STORE_SESSION_KEY = 'debug_dataframe_store'


def set_dataframe_in_store(request, df: pd.DataFrame):
    """Store a pandas DataFrame in the user's session (base64 encoded)."""
    # Convert DataFrame to pickle bytes, then encode as base64 string
    pickled_bytes = pickle.dumps(df)
    base64_string = base64.b64encode(pickled_bytes).decode('utf-8')
    request.session[STORE_SESSION_KEY] = base64_string
    request.session.modified = True


def get_dataframe_from_store(request):
    """Retrieve the pandas DataFrame from the user's session, or None if not set."""
    base64_string = request.session.get(STORE_SESSION_KEY)
    if base64_string:
        try:
            # Decode base64 string back to pickle bytes, then unpickle
            pickled_bytes = base64.b64decode(base64_string.encode('utf-8'))
            return pickle.loads(pickled_bytes)
        except Exception:
            return None
    return None


def clear_dataframe_store(request):
    """Remove the DataFrame from the user's session."""
    if STORE_SESSION_KEY in request.session:
        del request.session[STORE_SESSION_KEY]
        request.session.modified = True 