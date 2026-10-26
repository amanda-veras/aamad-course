from .models import KnowledgeMatch, Ticket

SYNTHETIC_TICKETS = {
    "SYN-101": Ticket(
        id="SYN-101",
        subject="Order tracking question",
        text="Could you confirm how I can check my order status?",
        records=["record:order-101.status = processing (fictional snapshot)"],
        gaps=[],
    ),
    "SYN-102": Ticket(
        id="SYN-102",
        subject="Conflicting payment records",
        text="I think I was charged twice for my order. Can you check?",
        records=[
            "record:payment-102-a.status = pending",
            "record:payment-102-b.status = settled",
        ],
        gaps=["No verified reconciliation record", "Payment records disagree"],
    ),
}

CORPUS_VERSION = "fictional-corpus-v1"
APPROVED_KNOWLEDGE = (
    KnowledgeMatch(
        source_id="TRACK-01",
        passage_id="passage-1",
        version="v1",
        excerpt="Customers can check an order's current status in the fictional customer portal.",
    ),
)


def synthetic_ticket(ticket_id: str) -> Ticket:
    ticket = SYNTHETIC_TICKETS.get(ticket_id)
    if ticket is None:
        raise KeyError(f"Unknown synthetic ticket: {ticket_id}")
    return ticket.model_copy(deep=True)


def record_references(ticket: Ticket) -> set[str]:
    refs = {f"ticket:{ticket.id}"}
    for record in ticket.records:
        if record.startswith("record:"):
            record_id = record.removeprefix("record:").split(".", maxsplit=1)[0]
            if record_id:
                refs.add(f"record:{record_id}")
    return refs
