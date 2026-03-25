import { useState } from "react";

export default function EmailNormalizer() {
  const [filename, setFilename] = useState("mail_raw.msg");
  const [from, setFrom] = useState("");
  const [sentAt, setSentAt] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");

  const [email, setEmail] = useState("");
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [outputMode, setOutputMode] = useState("multiline");

  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const generate = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("filename", filename);
      formData.append("from", from);
      formData.append("sentAt", sentAt);
      formData.append("to", to);
      formData.append("cc", cc);
      formData.append("subject", subject);
      formData.append("email", email);
      formData.append("outputMode", outputMode);

      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("http://localhost:3001/normalize", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setResult(`ERROR: ${data.error || "Request failed"}`);
        return;
      }

      setResult(data.normalized || "");
    } catch (err) {
      setResult(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(result);
  };

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <h2>Email Normalizer</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <input placeholder="Filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
        <input placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input placeholder="SentAt" value={sentAt} onChange={(e) => setSentAt(e.target.value)} />
        <input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} />
        <input placeholder="Cc" value={cc} onChange={(e) => setCc(e.target.value)} />
        <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            name="outputMode"
            value="multiline"
            checked={outputMode === "multiline"}
            onChange={(e) => setOutputMode(e.target.value)}
          />
          {" "}Multiline
        </label>

        <label>
          <input
            type="radio"
            name="outputMode"
            value="escaped"
            checked={outputMode === "escaped"}
            onChange={(e) => setOutputMode(e.target.value)}
          />
          {" "}Escaped (\n)
        </label>
      </div>

      <textarea
        placeholder="Paste raw email..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", height: 240, marginBottom: 12 }}
      />

      <input type="file" multiple onChange={handleFiles} />

      <div style={{ marginTop: 8, marginBottom: 12 }}>
        {files.map((f, i) => (
          <div key={i}>📎 {f.name}</div>
        ))}
      </div>

      <button onClick={generate} disabled={loading}>
        {loading ? "Generating..." : "Generate Normalized"}
      </button>

      <button onClick={copyResult} style={{ marginLeft: 8 }}>
        Copy
      </button>

      <textarea
        value={result}
        readOnly
        style={{ width: "100%", height: 360, marginTop: 16 }}
      />
    </div>
  );
}