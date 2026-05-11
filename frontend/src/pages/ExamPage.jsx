import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function ExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("http://localhost:5000/api/exams", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const selected = res.data.find((e) => e._id === id);
        setExam(selected);
        setAnswers(new Array(selected.questions.length).fill(""));
        setTimeLeft(selected.duration * 60);
      } catch (error) {
        console.error("Error fetching exam:", error);
      }
    };

    fetchExam();
  }, [id]);

  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft]);

  const handleChange = (qIndex, option) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = option;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/exams/submit",
        {
          examId: id,
          answers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(`Score: ${res.data.score}/${res.data.total}`);
      navigate("/student");
    } catch (error) {
      alert(error.response?.data?.message || "Error submitting exam");
      navigate("/student");
    }
  };

  if (!exam) return <p>Loading...</p>;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{exam.title}</h2>
        <div style={{ fontSize: "20px", fontWeight: "bold", color: "red" }}>
          Time Left: {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </div>
      </div>

      {exam.questions.map((q, index) => (
        <div key={index} style={{ marginBottom: "20px" }}>
          <p style={{ fontWeight: "bold" }}>{index + 1}. {q.question}</p>

          {q.options.map((opt, i) => (
            <div key={i}>
              <input
                type="radio"
                name={`q-${index}`}
                value={opt}
                onChange={() => handleChange(index, opt)}
              />
              {opt}
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        style={{
          padding: "10px 20px",
          background: "blue",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Submit Exam
      </button>
    </div>
  );
}

export default ExamPage;