# sockets.py
# This file provides the async_mode for SocketIO and can hold socket-related state.

# Determine async mode based on available libraries
try:
    import eventlet
    # eventlet.monkey_patch() should be called in the entry point (run.py)
    async_mode = 'eventlet'
except ImportError:
    async_mode = 'threading'

# Online users tracking (if needed in the future)
online_users = {}
