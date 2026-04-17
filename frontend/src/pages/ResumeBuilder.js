import { useState } from "react";
import jsPDF from "jspdf";
import axios from "axios";
import "./ResumeBuilder.css";

function ResumeBuilder() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    summary: "",
    skills: "",
    additional: "",
  });

  const [experience, setExperience] = useState([{ title: "", company: "", duration: "", description: "" }]);
  const [education, setEducation] = useState([{ institution: "", year: "", cgpa: "" }]);
  const [projects, setProjects] = useState([{ title: "", description: "" }]);
  const [certifications, setCertifications] = useState([""]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateArrayField = (array, setArray, index, field, value) => {
    const updated = [...array];
    updated[index][field] = value;
    setArray(updated);
  };

  const addArrayField = (array, setArray, emptyObj) => {
    setArray([...array, emptyObj]);
  };

  const updateCertification = (index, value) => {
    const updated = [...certifications];
    updated[index] = value;
    setCertifications(updated);
  };

  const addCertification = () => setCertifications([...certifications, ""]);

  const prepareFormForAI = () => ({
    ...formData,
    experience: experience.map((e) => `• ${e.title} - ${e.company} - ${e.duration} - ${e.description}`),
    education: education.map((e) => `• ${e.institution} - ${e.year} - ${e.cgpa}`),
    projects: projects.map((p) => `• ${p.title} - ${p.description}`),
    certifications: certifications.map((c) => `• ${c}`),
  });

  const enhanceWithAI = async () => {
    try {
      setLoading(true);
      setMessage("Generating ATS-friendly resume...");

      const flattenedForm = prepareFormForAI();
      const { data } = await axios.post("http://localhost:5000/api/generate-resume", { form: flattenedForm });

      if (data.enhanced) {
        setFormData((prev) => ({
          ...prev,
          summary: data.enhanced.summary || prev.summary,
          skills: (data.enhanced.skills || []).join("\n"),
          education: (data.enhanced.education || []).join("\n"),
          experience: (data.enhanced.experience || []).join("\n"),
          projects: (data.enhanced.projects || []).join("\n"),
          certifications: (data.enhanced.certifications || []).join("\n"),
          additional: (data.enhanced.additional || []).join("\n"),
          linkedin: data.enhanced.links?.linkedin || prev.linkedin,
          github: data.enhanced.links?.github || prev.github,
        }));
        setMessage("✅ Resume enhanced successfully!");
      } else {
        setMessage("⚠️ AI enhancement failed, please try again.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error: Failed to generate ATS-friendly version.");
    } finally {
      setLoading(false);
    }
  };

  const formatBullets = (text) =>
    text
      .split("\n")
      .map((line) => (line.trim() ? `• ${line.replace(/^•/, "").trim()}` : ""))
      .filter(Boolean)
      .join("\n");

  const handleDownload = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(formData.name || "Unnamed Candidate", 105, y, { align: "center" });
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    if (formData.email) { doc.text(`Email: ${formData.email}`, 20, y); y += 6; }
    if (formData.phone) { doc.text(`Phone: ${formData.phone}`, 20, y); y += 6; }
    if (formData.linkedin) { doc.text(`LinkedIn: ${formData.linkedin}`, 20, y); y += 6; }
    if (formData.github) { doc.text(`GitHub: ${formData.github}`, 20, y); y += 6; }
    y += 10;

    const addSection = (title, content, isBulleted = false) => {
      if (!content || !content.trim()) return;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, 20, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const formatted = isBulleted ? formatBullets(content) : content.trim();
      const lines = doc.splitTextToSize(formatted, 170);
      doc.text(lines, 25, y);
      y += lines.length * 6 + 4;

      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);
      y += 10;
    };

    addSection("Professional Summary", formData.summary);
    addSection("Skills", formData.skills, true);
    addSection("Experience", formData.experience, true);
    addSection("Education", formData.education, true);
    addSection("Projects", formData.projects, true);
    addSection("Certifications", formData.certifications, true);
    addSection("Additional Information", formData.additional, true);

    doc.save(`${formData.name || "resume"}.pdf`);
  };

  return (
    <div className="home-wrapper">
      <div className="resume-builder-container info-section">
        <h2 className="resume-title">ATS Friendly Resume Builder</h2>

        <form className="resume-form">
          {["name","email","phone","linkedin","github","summary","skills","additional"].map((field) => (
            <div key={field} className="form-row">
              <label>{field.toUpperCase()}</label>
              <textarea
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="input-box"
              />
            </div>
          ))}

          <h3>Experience</h3>
          {experience.map((exp, idx) => (
            <div key={idx} className="section-box">
              <input placeholder="Title" value={exp.title} onChange={(e) => updateArrayField(experience, setExperience, idx, "title", e.target.value)} />
              <input placeholder="Company" value={exp.company} onChange={(e) => updateArrayField(experience, setExperience, idx, "company", e.target.value)} />
              <input placeholder="Duration" value={exp.duration} onChange={(e) => updateArrayField(experience, setExperience, idx, "duration", e.target.value)} />
              <textarea placeholder="Description" value={exp.description} onChange={(e) => updateArrayField(experience, setExperience, idx, "description", e.target.value)} />
            </div>
          ))}
          <button type="button" className="get-started-btn" onClick={() => addArrayField(experience, setExperience, {title:"",company:"",duration:"",description:""})}>+ Add Experience</button>

          <h3>Education</h3>
          {education.map((edu, idx) => (
            <div key={idx} className="section-box">
              <input placeholder="Institution" value={edu.institution} onChange={(e) => updateArrayField(education, setEducation, idx, "institution", e.target.value)} />
              <input placeholder="Year" value={edu.year} onChange={(e) => updateArrayField(education, setEducation, idx, "year", e.target.value)} />
              <input placeholder="CGPA" value={edu.cgpa} onChange={(e) => updateArrayField(education, setEducation, idx, "cgpa", e.target.value)} />
            </div>
          ))}
          <button type="button" className="get-started-btn" onClick={() => addArrayField(education, setEducation, {institution:"",year:"",cgpa:""})}>+ Add Education</button>

          <h3>Projects</h3>
          {projects.map((p, idx) => (
            <div key={idx} className="section-box">
              <input placeholder="Project Title" value={p.title} onChange={(e) => updateArrayField(projects, setProjects, idx, "title", e.target.value)} />
              <textarea placeholder="Project Description" value={p.description} onChange={(e) => updateArrayField(projects, setProjects, idx, "description", e.target.value)} />
            </div>
          ))}
          <button type="button" className="get-started-btn" onClick={() => addArrayField(projects, setProjects, {title:"",description:""})}>+ Add Project</button>

          <h3>Certifications</h3>
          {certifications.map((c, idx) => (
            <input key={idx} placeholder="Certification" value={c} onChange={(e) => updateCertification(idx, e.target.value)} />
          ))}
          <button type="button" className="get-started-btn" onClick={addCertification}>+ Add Certification</button>

          <button type="button" className="get-started-btn" onClick={enhanceWithAI} disabled={loading}>{loading ? "Enhancing..." : "Enhance with AI"}</button>
          <button type="button" className="get-started-btn" onClick={handleDownload}>Download ATS Resume</button>
          {message && <p className="success-message">{message}</p>}
        </form>
      </div>
    </div>
  );
  
}



export default ResumeBuilder;