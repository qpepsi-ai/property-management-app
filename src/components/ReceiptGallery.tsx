import Link from "next/link";
import Badge from "@/components/ui/Badge";

export type ReceiptItem = {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string | null;
  address: string | undefined;
  imageUrl: string | null;
  needsReview: boolean;
};

function Thumbnail({ imageUrl, className }: { imageUrl: string | null; className: string }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-neutral-bg ${className}`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-2xl text-muted">🧾</span>
      )}
    </div>
  );
}

export default function ReceiptGallery({
  items,
  view,
}: {
  items: ReceiptItem[];
  view: "grid" | "table";
}) {
  if (view === "table") {
    return (
      <div className="overflow-x-auto rounded-2xl bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="py-2 pr-4 font-normal">Receipt</th>
              <th className="py-2 pr-4 font-normal">Date</th>
              <th className="py-2 pr-4 font-normal">Description</th>
              <th className="py-2 pr-4 font-normal">Property</th>
              <th className="py-2 pr-4 font-normal">Category</th>
              <th className="py-2 pr-4 text-right font-normal">Amount</th>
              <th className="py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const description = item.description ?? item.category;
              return (
                <tr key={item.id} className="border-b border-border/60 text-foreground">
                  <td className="py-2 pr-4">
                    {item.imageUrl ? (
                      <Link href={`/receipts/${item.id}`}>
                        <Thumbnail imageUrl={item.imageUrl} className="h-10 w-10 rounded-md" />
                      </Link>
                    ) : (
                      <Thumbnail imageUrl={null} className="h-10 w-10 rounded-md" />
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-4">{item.date}</td>
                  <td className="py-2 pr-4 font-medium">
                    {item.imageUrl ? (
                      <Link
                        href={`/receipts/${item.id}`}
                        className="hover:text-accent hover:underline"
                      >
                        {description}
                      </Link>
                    ) : (
                      description
                    )}
                  </td>
                  <td className="py-2 pr-4">{item.address}</td>
                  <td className="py-2 pr-4">{item.category}</td>
                  <td className="whitespace-nowrap py-2 pr-4 text-right font-medium">
                    ${Number(item.amount).toFixed(2)}
                  </td>
                  <td className="py-2">
                    {item.needsReview ? (
                      <Badge variant="warning">Needs review</Badge>
                    ) : (
                      <span className="text-muted">–</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item) => {
        const card = (
          <div className="rounded-2xl bg-surface p-3 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md">
            <Thumbnail imageUrl={item.imageUrl} className="mb-2 aspect-square rounded-md" />
            {item.needsReview && (
              <div className="mb-1">
                <Badge variant="warning">Needs review</Badge>
              </div>
            )}
            <p className="truncate font-medium text-foreground">
              {item.description ?? item.category}
            </p>
            <p className="truncate text-muted">
              {item.address} · ${Number(item.amount).toFixed(2)}
            </p>
            <p className="text-muted">{item.date}</p>
          </div>
        );

        return (
          <div key={item.id}>
            {item.imageUrl ? <Link href={`/receipts/${item.id}`}>{card}</Link> : card}
          </div>
        );
      })}
    </div>
  );
}
