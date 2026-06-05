import { clientConfig } from "@/lib/config";
import { shortHash } from "@/lib/hash";

export interface TaskResultReceiptData {
  taskId: string;
  answer: string;
  model: string;
  provider: string;
  resultRoot: string;
  memoryRoot: string;
  computeHash: string;
  daCommitment: string;
  daStatus?: "attached" | "not_attached";
  runningTx?: string;
  completionTx: string;
}

export function TaskResultReceipt({ receipt }: { receipt: TaskResultReceiptData }) {
  return (
    <section className="task-result-receipt">
      <div className="section-heading-row">
        <div>
          <span className="section-kicker">Task result</span>
          <h3>Task #{receipt.taskId} completed</h3>
        </div>
        <a className="proof-link" href={`${clientConfig.explorerUrl}/tx/${receipt.completionTx}`} target="_blank" rel="noreferrer">View completion tx</a>
      </div>
      <article className="task-answer-card">
        <span>Agent answer</span>
        <p>{receipt.answer}</p>
      </article>
      <div className="receipt-card task-proof-card">
        <div className="receipt-row"><span>Model</span><strong>{receipt.model}</strong></div>
        <div className="receipt-row"><span>Provider</span><strong>{receipt.provider}</strong></div>
        <div className="receipt-row"><span>Result root</span><strong>{shortHash(receipt.resultRoot)}</strong></div>
        <div className="receipt-row"><span>Memory root</span><strong>{shortHash(receipt.memoryRoot)}</strong></div>
        <div className="receipt-row"><span>Compute hash</span><strong>{shortHash(receipt.computeHash)}</strong></div>
        <div className="receipt-row">
          <span>DA proof</span>
          <strong>{receipt.daStatus === "attached" ? shortHash(receipt.daCommitment) : "Not attached"}</strong>
        </div>
      </div>
    </section>
  );
}
