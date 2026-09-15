# Event Invitations

Per-child invitation sites (frej.nilsfrank.se, helge.nilsfrank.se) where guests read the
details of a party and book a seat in one of its time slots.

## Language

**Tenant**:
One child, addressed by a subdomain. Owns any number of Events.
_Avoid_: site, subdomain, host

**Event**:
One party a Tenant is throwing, with its own invitation text and Slots. Several Events can be
active at once for the same Tenant (e.g. family, friends, kids).
_Avoid_: party, kalas, invitation

**Slot**:
A bookable time window of an Event with a seat capacity.
_Avoid_: reservation, timeslot, EventSlot

**Rsvp**:
One household's answer to an Event: contact details, number of adults and children, notes,
and whether they are attending.
_Avoid_: guest, guests, booking, OSA

**Guest**:
The person on the other end of the invitation link, identified by their e-mail address.
_Avoid_: user, visitor

**Organizer**:
The parent running a Tenant's Events; the only one who may read Rsvps.
_Avoid_: host, admin, owner
