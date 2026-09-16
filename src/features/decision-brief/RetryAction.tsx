export function RetryAction({ onRetryAll }: { onRetryAll: () => void }) { return <button className="secondary-button" type="button" onClick={onRetryAll}>실패 항목만 다시 시도</button> }
