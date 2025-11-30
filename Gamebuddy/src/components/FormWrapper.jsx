export default function FormWrapper({ title, children }) {
  return (
    <div className="min-h-screen flex justify-center items-center pt-20">
      <div className="w-[380px] bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-center mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
}
