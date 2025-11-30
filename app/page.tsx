import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <header style={{ margin: "4rem 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "1rem", background: "linear-gradient(to right, #fff, #888)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Manage Projects with Precision
        </h1>
        <p style={{ color: "#888", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
          The premium WBS tool for directors, agencies, and clients.
        </p>
        <Link href="/new-project" className="btn-primary">
          Create New Project
        </Link>
      </header>

      <section>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Active Projects</h2>
        <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <p>No projects found. Start by creating one.</p>
        </div>
      </section>
    </div>
  );
}
