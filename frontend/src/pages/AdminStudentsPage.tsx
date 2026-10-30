import React, { useState, useEffect } from 'react';
import { studentApi } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import type { Student } from '../types';
import { useToastContext } from '../context/ToastContext';
import {
  Users,
  Search,
  Plus,
  Mail,
  GraduationCap,
  X,
  Loader2,
  Trash2,
  Pencil,
  AlertTriangle,
} from 'lucide-react';

export const AdminStudentsPage: React.FC = () => {
  const { showToast } = useToastContext();

  const [students, setStudents] = useState<Student[]>(() => offlineStorage.getStudents());
  const [departments, setDepartments] = useState<string[]>(['CSE', 'ECE', 'MECH', 'EEE']);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Form State
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');
  const [dept, setDept] = useState('CSE');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (selectedDept) params.dept = selectedDept;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [studRes, deptRes] = await Promise.all([
        studentApi.list(params),
        studentApi.departments(),
      ]);
      setStudents(studRes.data.students);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error('Error fetching students', err);
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setRegNo('');
    setName('');
    setMail('');
    setDept(departments.length > 0 ? departments[0] : 'CSE');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setRegNo(student.reg_no);
    setName(student.name);
    setMail(student.mail);
    setDept(student.dept);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (student: Student) => {
    setDeletingStudent(student);
    setDeleteModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!regNo.trim() || !name.trim() || !mail.trim()) {
      setFormError('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingStudent) {
        await studentApi.update(editingStudent.reg_no, {
          name: name.trim(),
          mail: mail.trim(),
          dept: dept.trim(),
        });
        showToast(`Student ${regNo} updated successfully`, 'success');
      } else {
        await studentApi.create({
          reg_no: regNo.trim().toUpperCase(),
          name: name.trim(),
          mail: mail.trim(),
          dept: dept.trim(),
        });
        showToast(`Student ${regNo} added successfully`, 'success');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to save student details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setSubmitting(true);
    try {
      await studentApi.delete(deletingStudent.reg_no);
      showToast(`Student ${deletingStudent.reg_no} deleted successfully`, 'success');
      setDeleteModalOpen(false);
      setDeletingStudent(null);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete student', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-500" />
            Student Directory Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain academic student records linked to VITSpace role-based authentication.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Student Record
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <GraduationCap className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Reg No, Name, or Email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-xs">Loading students from Oracle DB...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-slate-800">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No student records found</h3>
          <p className="text-xs text-slate-400 mt-1">Try modifying your search or add a new record.</p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-2xl overflow-hidden glass-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Registration Number</th>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {students.map((st) => (
                  <tr key={st.reg_no} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-3.5 font-bold text-blue-400 tracking-wider">
                      {st.reg_no}
                    </td>
                    <td className="p-3.5 font-semibold text-white">{st.name}</td>
                    <td className="p-3.5 text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {st.mail}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold text-[11px]">
                        {st.dept}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(st)}
                          className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(st)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Student"
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
      )}

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <h3 className="text-base font-bold text-white">
                {editingStudent ? `Edit Student ${editingStudent.reg_no}` : 'Add New Student Record'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registration Number *
                </label>
                <input
                  type="text"
                  value={regNo}
                  disabled={!!editingStudent}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="e.g. 21BCE1234"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={mail}
                  onChange={(e) => setMail(e.target.value)}
                  placeholder="e.g. john.doe@vitstudent.ac.in"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Department *
                </label>
                <input
                  type="text"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  placeholder="e.g. CSE, ECE, MECH"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Delete Student {deletingStudent.reg_no}?</h3>
              <p className="text-xs text-slate-400 mt-2">
                This will delete the student's academic record and associated authentication account from Oracle DB.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
