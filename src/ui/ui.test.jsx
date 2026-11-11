/** Accessibility of shared controls: what screen readers are told. */
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { I18nProvider } from "@/i18n";
import Segmented from "./Segmented";
import Checkbox from "./Checkbox";

jest.mock(
  "lucide-react-native",
  () => new Proxy({ __esModule: true }, { get: (t, k) => (k in t ? t[k] : () => null) }),
);
jest.mock("uniwind", () => ({
  useCSSVariable: (v) => (Array.isArray(v) ? v.map(() => "#000") : "#000"),
  withUniwind: (C) => C,
}));

afterEach(cleanup);

test("Segmented is a radio group that says which option is chosen", async () => {
  const onChange = jest.fn();
  await render(
    <I18nProvider>
      <Segmented
        label="Appearance"
        value="light"
        onChange={onChange}
        options={[
          ["light", "Light"],
          ["dark", "Dark"],
        ]}
      />
    </I18nProvider>,
  );
  expect(screen.getByLabelText("Appearance").props.accessibilityRole).toBe("radiogroup");
  expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "Dark" })).not.toBeChecked();
  await fireEvent.press(screen.getByRole("radio", { name: "Dark" }));
  expect(onChange).toHaveBeenCalledWith("dark");
});

test("Checkbox says whether it's ticked", async () => {
  const onChange = jest.fn();
  await render(<Checkbox checked={false} onChange={onChange} label="I agree" />);
  expect(screen.getByRole("checkbox", { name: "I agree" })).not.toBeChecked();
  await fireEvent.press(screen.getByRole("checkbox"));
  expect(onChange).toHaveBeenCalledWith(true);
});
