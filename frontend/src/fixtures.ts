import type { ReviewOutput, Ticket } from './domain';

export const tickets: Ticket[] = [
  {
    id: 'SYN-101',
    subject: 'Order tracking question',
    text: 'Could you confirm how I can check my order status?',
    records: ['record:order-101.status = processing (fictional snapshot)'],
    gaps: [],
  },
  {
    id: 'SYN-102',
    subject: 'Conflicting payment records',
    text: 'I think I was charged twice for my order. Can you check?',
    records: ['record:payment-102-a.status = pending', 'record:payment-102-b.status = settled'],
    gaps: ['No verified reconciliation record', 'Payment records disagree'],
  },
];

export function sampleOutputs(ticketId: string): ReviewOutput[] {
  const conflict = ticketId === 'SYN-102';
  const missingFacts = conflict ? ['Verified payment reconciliation'] : [];
  return [
    {
      type: 'classification', status: conflict ? 'limited' : 'complete',
      detail: conflict ? 'Possible duplicate charge · priority uncertain' : 'Order status question · routine',
      rationale: conflict ? 'The supplied payment records disagree.' : 'The question concerns order tracking.',
      evidenceRefs: [conflict ? 'ticket:SYN-102' : 'ticket:SYN-101'], missingFacts,
    },
    {
      type: 'sentiment_context', status: 'complete',
      detail: conflict ? 'Concerned tone; possible billing impact' : 'Neutral tone; status inquiry',
      rationale: 'Based on the wording of the synthetic ticket, not a referral trigger.',
      evidenceRefs: [`ticket:${ticketId}`], missingFacts: [],
    },
    {
      type: 'knowledge', status: conflict ? 'limited' : 'complete',
      detail: conflict ? 'No applicable approved passage in this demo' : 'Fictional tracking guide: check the order status in the customer portal.',
      rationale: conflict ? 'No matching fictional knowledge was provided.' : 'Local sample passage for this synthetic question.',
      evidenceRefs: conflict ? [] : ['knowledge:TRACK-01/passage-1/v1'], missingFacts,
    },
    {
      type: 'response', status: conflict ? 'limited' : 'complete',
      detail: conflict
        ? 'Cannot confirm a duplicate charge from these records. A reviewer should verify the payment history before drafting an answer.'
        : 'You can check your order status in the customer portal. [TRACK-01/passage-1/v1]',
      rationale: conflict ? 'No verified reconciliation or applicable policy.' : 'Sample draft cites the fictional tracking guide.',
      evidenceRefs: conflict ? ['record:payment-102-a', 'record:payment-102-b'] : ['knowledge:TRACK-01/passage-1/v1'], missingFacts,
    },
    {
      type: 'escalation', status: conflict ? 'limited' : 'complete',
      detail: conflict
        ? 'Human assessment: recommended (conflicting records). Specialist referral: not established.'
        : 'Human assessment: not suggested by the evidence. Specialist referral: not suggested.',
      rationale: conflict ? 'Verification is needed; the ticket alone does not establish a referral procedure.' : 'No evidence of a specialist-only issue.',
      evidenceRefs: conflict ? ['record:payment-102-a', 'record:payment-102-b'] : [`ticket:${ticketId}`], missingFacts,
    },
  ];
}
