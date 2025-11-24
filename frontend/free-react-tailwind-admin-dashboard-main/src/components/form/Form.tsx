import { FC, ReactNode, FormEvent } from "react";

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

const Form: FC<FormProps> = ({ onSubmit, children, className = "", ...props }) => {
  return (
    <form
      {...props}
      onSubmit={(event) => {
        event.preventDefault(); // Prevent default form submission
        onSubmit(event);
      }}
      className={` ${className}`} // Default spacing between form fields
    >
      {children}
    </form>
  );
};

export default Form;
