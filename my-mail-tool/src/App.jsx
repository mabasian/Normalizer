import { useState } from "react";
import EmailNormalizer from "./components/EmailNormalizer";


export default function App() {
  const [result, setResult] = useState("");

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <EmailNormalizer result={result} setResult={setResult} />
 
    </div>
  );
}