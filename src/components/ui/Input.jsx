import Field from './Field';

export default function Input({ type = 'text', ...props }) {
  return <Field {...props} as="input" type={type} />;
}
