import { getDonors } from "@/lib/treasurer-data";
import CloseButton from "@/components/close-button";

export const dynamic = "force-dynamic";

export default async function DonorListPage() {
  const donors = await getDonors();

  return (
    <main className="utility-shell">
      <section className="utility-card">
        <CloseButton />
        <h1>Donor List</h1>
        <div className="table-shell donor-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {donors.map((donor) => (
                <tr key={donor.id}>
                  <td>{donor.name}</td>
                  <td>₹{donor.amount.toFixed(2)}</td>
                  <td>
                    <span className={donor.paid_or_not ? "status paid" : "status unpaid"}>
                      {donor.paid_or_not ? "✓ Paid" : "✕ Due"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
