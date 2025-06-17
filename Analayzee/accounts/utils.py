import pandas as pd
import pickle
from django.conf import settings

STORE_SESSION_KEY = 'debug_dataframe_store'


def set_dataframe_in_store(request, df: pd.DataFrame):
    """Store a pandas DataFrame in the user's session (pickled)."""
    request.session[STORE_SESSION_KEY] = pickle.dumps(df)
    request.session.modified = True


def get_dataframe_from_store(request):
    """Retrieve the pandas DataFrame from the user's session, or None if not set."""
    pickled = request.session.get(STORE_SESSION_KEY)
    if pickled:
        try:
            return pickle.loads(pickled)
        except Exception:
            return None
    return None


def clear_dataframe_store(request):
    """Remove the DataFrame from the user's session."""
    if STORE_SESSION_KEY in request.session:
        del request.session[STORE_SESSION_KEY]
        request.session.modified = True 