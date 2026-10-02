import React, { useState, useRef } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import {
  Upload,
  Sparkles,
  Loader2,
  Check,
  Edit2,
  FileText,
  FileCode,
  File,
  Trash2,
  Plus,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';

export default function LecturerMaterials({ materials, setMaterials, questions, setQuestions, onShowToast, t }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCourse, setUploadCourse] = useState('SWD392 - Kiến trúc và Thiết kế Phần mềm');

  // Real File Upload States
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Generation flow states
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [generatedDrafts, setGeneratedDrafts] = useState([]);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileTypeDesc = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'PDF Document';
    if (ext === 'doc' || ext === 'docx') return 'Word Document';
    if (ext === 'ppt' || ext === 'pptx') return 'Presentation Slides';
    if (ext === 'txt') return 'Plain Text';
    return 'Lecture Document';
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setIsUploadingFile(true);

    const fileInfo = {
      name: file.name,
      sizeFormatted: formatFileSize(file.size),
      typeDesc: getFileTypeDesc(file.name),
    };

    setTimeout(() => {
      setSelectedFile(fileInfo);
      setUploadTitle(file.name);
      setIsUploadingFile(false);
    }, 400);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    const finalTitle = uploadTitle.trim() || (selectedFile ? selectedFile.name : 'Tai_lieu_chuyen_nganh.pdf');

    const newMat = {
      id: `mat-${Date.now()}`,
      title: finalTitle,
      course: uploadCourse,
      type: selectedFile ? selectedFile.typeDesc : 'PDF Document',
      size: selectedFile ? selectedFile.sizeFormatted : '2.4 MB',
      status: 'Ready',
      uploadDate: new Date().toISOString().split('T')[0],
    };

    setMaterials([newMat, ...materials]);
    setIsUploadOpen(false);
    setSelectedFile(null);
    setUploadTitle('');
    onShowToast(`Đã thêm tệp tài liệu: ${newMat.title} (${newMat.size})`);
  };

  const handleDeleteMaterial = (matId, matTitle) => {
    setMaterials(materials.filter((m) => m.id !== matId));
    onShowToast(`Đã xóa tài liệu: ${matTitle}`);
  };

  const handleTriggerGeneration = (material) => {
    setSelectedMaterial(material);
    setIsProcessing(true);
    setGeneratedDrafts([]);

    setTimeout(() => {
      setIsProcessing(false);
      setGeneratedDrafts([
        {
          id: 'draft-1',
          content: 'Phân tích sự khác biệt cốt lõi giữa Kiến trúc Đơn khối (Monolithic) và Vi dịch vụ (Microservices). Khi nào hệ thống phần mềm nên tách microservices?',
          course: material.course,
          topic: 'Microservices Architecture',
          duration: '2 mins',
          status: 'Draft',
        },
        {
          id: 'draft-2',
          content: 'Trong thiết kế Clean Architecture, nguyên tắc Dependency Inversion (DIP) được áp dụng như thế nào để tách biệt Domain Logic khỏi cơ sở dữ liệu và framework bên ngoài?',
          course: material.course,
          topic: 'Clean Architecture & SOLID',
          duration: '2 mins',
          status: 'Draft',
        },
      ]);
      onShowToast(t.draftsForReviewTitle);
    }, 1600);
  };

  const handleApproveDraft = (draft) => {
    const newQuestion = {
      id: `q-${Date.now()}`,
      content: draft.content,
      course: draft.course,
      source: 'AI Assisted',
      status: 'Approved',
      topic: draft.topic,
      idealAnswerPoints: [
        'Khái niệm cốt lõi theo giáo trình',
        'Phân tích ưu nhược điểm kỹ thuật',
        'Liên hệ áp dụng thực tiễn trong dự án'
      ]
    };

    setQuestions([newQuestion, ...questions]);
    setGeneratedDrafts(generatedDrafts.filter((d) => d.id !== draft.id));
    onShowToast('Câu hỏi đã được duyệt & lưu vào Ngân hàng câu hỏi.');
  };

  const handleStartEdit = (draft) => {
    setEditingDraftId(draft.id);
    setEditingContent(draft.content);
  };

  const handleSaveEdit = (draftId) => {
    setGeneratedDrafts(
      generatedDrafts.map((d) => (d.id === draftId ? { ...d, content: editingContent } : d))
    );
    setEditingDraftId(null);
    onShowToast(t.saveText);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-apptext tracking-tight">{t.materialsTitle}</h1>
          <p className="text-sm text-mutedtext mt-1">{t.materialsSub}</p>
        </div>
        <button
          onClick={() => {
            setSelectedFile(null);
            setUploadTitle('');
            setIsUploadOpen(true);
          }}
          className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Upload className="w-4 h-4" />
          <span>{t.uploadMaterial}</span>
        </button>
      </div>

      {/* Uploaded Materials Table */}
      <div className="bg-surface rounded-xl border border-appborder shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-appborder text-xs font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">Tên tài liệu giáo trình</th>
                <th className="px-5 py-3">{t.colCourse}</th>
                <th className="px-5 py-3">Định dạng & Dung lượng</th>
                <th className="px-5 py-3">Ngày tải lên</th>
                <th className="px-5 py-3">{t.colStatus}</th>
                <th className="px-5 py-3 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appborder">
              {materials.map((mat) => (
                <tr key={mat.id} className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-2">
                    <div className="flex items-center space-x-2.5 font-medium text-apptext">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate max-w-xs">{mat.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-2 text-mutedtext text-xs">{mat.course}</td>
                  <td className="px-5 py-2 text-mutedtext text-xs">
                    <span className="font-medium text-apptext">{mat.type}</span>
                    <span className="text-mutedtext/60"> &bull; </span>
                    <span className="font-mono text-[11px]">{mat.size || '2.4 MB'}</span>
                  </td>
                  <td className="px-5 py-2 text-mutedtext text-xs font-mono">{mat.uploadDate}</td>
                  <td className="px-5 py-2">
                    <StatusBadge status={t.statusReady} />
                  </td>
                  <td className="px-5 py-2 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleTriggerGeneration(mat)}
                        className="h-8 px-3 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors inline-flex items-center space-x-1.5 shadow-xs"
                        title="Yêu cầu AI trích xuất câu hỏi viva"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t.generateQuestions}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                        className="p-1.5 rounded-md text-mutedtext hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 3: Processing State */}
      {isProcessing && (
        <div className="bg-surface rounded-xl border border-blue-200 dark:border-blue-800 p-8 shadow-xs text-center space-y-3 animate-fade-in transition-colors">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/40 text-primary">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-base font-semibold text-apptext">{t.processingMaterial}</h3>
          <p className="text-xs text-mutedtext max-w-md mx-auto leading-relaxed">
            {t.processingMaterialSub}
          </p>
        </div>
      )}

      {/* Step 4: Generated Questions for Lecturer Review */}
      {generatedDrafts.length > 0 && !isProcessing && (
        <div className="bg-surface rounded-xl border border-appborder p-6 shadow-xs space-y-4 animate-fade-in transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-appborder gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-apptext">{t.draftsForReviewTitle}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {t.requiresReview}
                </span>
              </div>
              <p className="text-xs text-mutedtext mt-0.5">
                {t.draftsForReviewSub}
              </p>
            </div>
            <span className="text-xs text-mutedtext shrink-0">Nguồn: {selectedMaterial?.title}</span>
          </div>

          <div className="space-y-3">
            {generatedDrafts.map((draft, idx) => (
              <div key={draft.id} className="p-4 rounded-lg border border-appborder bg-canvas space-y-2 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">Câu hỏi {idx + 1} (AI Đề xuất)</span>
                  <div className="flex items-center space-x-3 text-xs">
                    {editingDraftId === draft.id ? (
                      <button
                        onClick={() => handleSaveEdit(draft.id)}
                        className="font-semibold text-primary hover:underline"
                      >
                        {t.saveText}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(draft)}
                        className="font-medium text-apptext hover:underline flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{t.editPrompt}</span>
                      </button>
                    )}
                  </div>
                </div>

                {editingDraftId === draft.id ? (
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded border border-appborder bg-surface text-sm text-apptext focus:border-primary focus:outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-apptext leading-relaxed">
                    "{draft.content}"
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-appborder text-xs gap-2">
                  <div className="text-mutedtext flex items-center space-x-3">
                    <span>Môn: {draft.course}</span>
                    <span>&bull;</span>
                    <span>Chuyên đề: {draft.topic}</span>
                  </div>
                  <button
                    onClick={() => handleApproveDraft(draft)}
                    className="h-8 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center space-x-1 shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.approveAndSave}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Material Modal with Real File Picker */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title={t.uploadMaterial}>
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* Hidden native file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
            className="hidden"
          />

          {/* Interactive Drag & Drop / File Picker Area */}
          <div
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-primary bg-primary-light/50 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-appborder hover:border-primary/60 bg-canvas hover:bg-primary-light/20'
            }`}
          >
            {isUploadingFile ? (
              <div className="py-4 space-y-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                <div className="text-xs font-medium text-apptext">Đang đọc dữ liệu tệp tin…</div>
              </div>
            ) : selectedFile ? (
              <div className="py-2 space-y-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-apptext truncate max-w-sm mx-auto">{selectedFile.name}</div>
                  <div className="text-xs text-mutedtext mt-0.5">
                    {selectedFile.typeDesc} &bull; <strong className="text-apptext font-mono">{selectedFile.sizeFormatted}</strong>
                  </div>
                </div>
                <div className="inline-flex items-center space-x-1 text-xs text-primary font-semibold hover:underline pt-1">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Chọn tệp khác</span>
                </div>
              </div>
            ) : (
              <div className="py-3 space-y-2">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-primary flex items-center justify-center mx-auto shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-apptext">
                    Bấm để chọn tệp tài liệu từ máy tính hoặc kéo thả vào đây
                  </div>
                  <div className="text-xs text-mutedtext mt-1">
                    Hỗ trợ định dạng PDF, Word (.docx), PowerPoint (.pptx), Text (.txt) lên tới 50MB
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-medium text-apptext mb-1">Tên tài liệu / Tiêu đề giáo trình *</label>
            <input
              type="text"
              required
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="VD: SWD392_Ch04_Microservices_Clean_Architecture.pdf"
              className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Associated Course */}
          <div>
            <label className="block text-xs font-medium text-apptext mb-1">Môn học / Học phần liên quan *</label>
            <select
              value={uploadCourse}
              onChange={(e) => setUploadCourse(e.target.value)}
              className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="SWD392 - Kiến trúc và Thiết kế Phần mềm">SWD392 - Kiến trúc và Thiết kế Phần mềm</option>
              <option value="PRN231 - Lập trình ứng dụng phân tán .NET">PRN231 - Lập trình ứng dụng phân tán .NET</option>
              <option value="CSD201 - Cấu trúc dữ liệu và giải thuật">CSD201 - Cấu trúc dữ liệu và giải thuật</option>
              <option value="SWP391 - Dự án Phát triển Phần mềm">SWP391 - Dự án Phát triển Phần mềm</option>
              <option value="PRJ301 - Lập trình ứng dụng Java Web">PRJ301 - Lập trình ứng dụng Java Web</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="h-10 px-4 rounded-lg border border-appborder text-xs font-medium text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.uploadMaterial}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
