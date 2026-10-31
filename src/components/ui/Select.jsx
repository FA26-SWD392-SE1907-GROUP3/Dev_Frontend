import Field from './Field';

/** Pass option elements as children to preserve native keyboard navigation. */
export default function Select(props) {
  return <Field {...props} as="select" />;
}
