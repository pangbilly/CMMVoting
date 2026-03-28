export function getVoterId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("cmm-voter-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cmm-voter-id", id);
  }
  return id;
}
