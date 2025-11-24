import Input from './components/form/input/InputField';
import Button from './components/ui/button/Button';
import Checkbox from './components/form/input/Checkbox';
import FileInput from './components/form/FileInput';
import Form from './components/form/Form';
import Label from './components/form/Label';

// Try to use standard HTML attributes that might not be in the interface
function TestComponent() {
  return (
    <div>
      {/* Test Input with standard HTML attributes */}
      <Input 
        required={true}
        autoComplete="email"
        aria-label="Email input"
        data-testid="email-input"
      />
      
      {/* Test Button with standard HTML attributes */}
      <Button 
        type="submit"
        form="my-form"
        aria-label="Submit button"
        data-testid="submit-button"
      >
        Submit
      </Button>
      
      {/* Test Checkbox with standard HTML attributes */}
      <Checkbox 
        checked={false}
        onChange={() => {}}
        required={true}
        aria-label="Accept terms"
        data-testid="terms-checkbox"
      />
      
      {/* Test FileInput with standard HTML attributes */}
      <FileInput 
        accept=".pdf,.doc"
        multiple={true}
        aria-label="File upload"
      />
      
      {/* Test Form with standard HTML attributes */}
      <Form 
        onSubmit={() => {}}
        method="post"
        action="/submit"
      >
        <div>Form content</div>
      </Form>
      
      {/* Test Label with standard HTML attributes */}
      <Label 
        aria-label="Field label"
        data-testid="label"
      >
        Label text
      </Label>
    </div>
  );
}

export default TestComponent;
