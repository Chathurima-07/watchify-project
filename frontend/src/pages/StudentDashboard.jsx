import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // 🔹 Fetch exams
        const examsRes = await axios.get(
          "http://localhost:5000/api/exams",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // 🔹 Fetch results
        const resultsRes = await axios.get(
          "http://localhost:5000/api/exams/my-results",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setExams(examsRes.data);
        setResults(resultsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔄 Loading state
  if (loading) return <h3>Loading...</h3>;

  return (
    <div style={{ padding: "20px" }}>
      {/* 🟢 EXAMS SECTION */}
      <h2>Available Exams</h2>

      {exams.length === 0 ? (
        <p>No exams available</p>
      ) : (
        exams.map((exam) => (
          <div
            key={exam._id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
            }}
          >
            <h3>{exam.title}</h3>
            <p>Duration: {exam.duration} mins</p>

            {results.find((r) => r.exam?._id === exam._id) ? (
              <p style={{ color: "green", fontWeight: "bold" }}>
                ✅ Completed (Score: {results.find((r) => r.exam?._id === exam._id).score}/{results.find((r) => r.exam?._id === exam._id).total})
              </p>
            ) : (
              <button onClick={() => navigate(`/exam/${exam._id}`)}>
                Start Exam
              </button>
            )}
          </div>
        ))
      )}

      {/* 🔵 RESULTS SECTION */}
      <h2 style={{ marginTop: "30px" }}>My Results</h2>

      {results.length === 0 ? (
        <p>No attempts yet</p>
      ) : (
        results.map((r) => (
          <div
            key={r._id}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              background: "#f9f9f9",
            }}
          >
            <h4>{r.exam?.title}</h4>
            <p>
              Score: {r.score}/{r.total}
            </p>
            <p>
              Attempted on:{" "}
              {new Date(r.createdAt).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default StudentDashboard;