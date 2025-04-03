
export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      <main className="min-h-[calc(100vh-190px)]">{children}</main>
    </>
  );
}