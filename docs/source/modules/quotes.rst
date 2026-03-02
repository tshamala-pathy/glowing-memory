Quotes Module
=============

The quotes module handles incoming quote requests from clients, admin review
and responses, and the transition from *pending* to *approved* or *declined*.

Topics to cover here:

- Quote data model and key fields
- Status state machine (pending → replied → approved/declined → paid)
- API endpoints for creating, listing, and managing quotes
- How automatic invoice creation is triggered after approval

