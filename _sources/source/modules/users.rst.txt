Users Module
============

The ``users`` app handles authentication, profile management, notifications,
and activity logging.


Models
------

.. automodule:: users.models
   :members:
   :undoc-members:
   :show-inheritance:


Activity Logging
----------------

The activity log records user actions (login, logout, quote approvals, payments,
profile updates, etc.) for transparency and audit purposes. Use
:func:`users.activity.log_activity` from views and signals.

.. automodule:: users.activity
   :members:
   :undoc-members:
   :show-inheritance:


Views / API
-----------

.. automodule:: users.views
   :members:
   :undoc-members:
   :show-inheritance:
