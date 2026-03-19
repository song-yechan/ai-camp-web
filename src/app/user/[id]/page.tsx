import UserDetailClient from "./UserDetailClient";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 pb-20 md:pb-12">
      <UserDetailClient userId={id} />
    </div>
  );
}
