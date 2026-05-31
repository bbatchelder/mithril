import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { axe } from "@/test/axe";
import { Alert } from "../alert";
import { AnchorButton } from "../anchor-button";
import { Button } from "../button";
import { ButtonGroup } from "../button-group";
import { Callout } from "../callout";
import { CardList } from "../card-list";
import { Checkbox } from "../checkbox";
import { Dialog } from "../dialog";
import { MultistepDialog, DialogStep } from "../multistep-dialog";
import { Drawer } from "../drawer";
import { HTMLTable } from "../html-table";
import { InputGroup } from "../input-group";
import { Menu, MenuDivider, MenuItem } from "../menu";
import { NumericInput } from "../numeric-input";
import { Popover } from "../popover";
import { Radio } from "../radio";
import { MultiSelect } from "../multi-select";
import { Slider } from "../slider";
import { Suggest } from "../suggest";
import { Switch } from "../switch";
import { Tab, Tabs } from "../tabs";
import { Tag } from "../tag";
import { TimePicker } from "../time-picker";

/**
 * axe-core smoke tests — a CI regression net for accessibility *wiring* (role / accessible
 * name / ARIA / structure). See `src/test/axe.ts` for the matcher and its hard limits:
 * jsdom has no layout/paint, so color-contrast (1.4.3) and tap-target (2.5.8) are NOT
 * covered here — those are validated by the chrome axe sweep (handoff 0070). The dedicated
 * behavior tests already assert the deep keyboard/active-descendant flows; this file just
 * locks in that each component renders an axe-clean tree in a representative configuration.
 *
 * Each case renders a component the way a consumer is *expected* to (with an accessible
 * name where the element needs one), so a regression that drops a name/role fails CI.
 */

// ---- Inline (non-portaled) components ---------------------------------------------------

describe("axe smoke — inline components", () => {
    it("Button (with text)", async () => {
        const { container } = render(<Button intent="primary">Save</Button>);
        expect(await axe(container)).toHaveNoViolations();
    });

    it("Button (icon-only needs an accessible name)", async () => {
        const { container } = render(<Button icon="cog" aria-label="Settings" />);
        expect(await axe(container)).toHaveNoViolations();
    });

    it("AnchorButton (link styled as a button)", async () => {
        const { container } = render(
            <AnchorButton href="#" intent="primary">
                Continue
            </AnchorButton>,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it("ButtonGroup (labelled set of buttons)", async () => {
        const { container } = render(
            <ButtonGroup aria-label="Alignment">
                <Button>Left</Button>
                <Button>Center</Button>
                <Button>Right</Button>
            </ButtonGroup>,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it("Checkbox / Radio / Switch (labelled)", async () => {
        const { container } = render(
            <>
                <Checkbox label="Accept terms" />
                <Radio name="grp" label="Option A" />
                <Switch label="Enable feature" />
            </>,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it("InputGroup (aria-label)", async () => {
        const { container } = render(<InputGroup aria-label="Search" placeholder="Search…" />);
        expect(await axe(container)).toHaveNoViolations();
    });

    it("NumericInput (spinbutton with a name)", async () => {
        const { container } = render(<NumericInput aria-label="Quantity" min={0} max={10} />);
        expect(await axe(container)).toHaveNoViolations();
    });

    it("Slider (aria-label forwarded to the thumb)", async () => {
        const { container } = render(<Slider aria-label="Volume" min={0} max={10} defaultValue={5} />);
        expect(await axe(container)).toHaveNoViolations();
    });

    it("TimePicker (named spinbutton segments)", async () => {
        const { container } = render(<TimePicker />);
        expect(await axe(container)).toHaveNoViolations();
    });

    it("CardList (listitem children)", async () => {
        const { container } = render(
            <CardList aria-label="Files">
                <div>report.pdf</div>
                <div>notes.txt</div>
            </CardList>,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it("Callout", async () => {
        const { container } = render(
            <Callout intent="warning" title="Heads up">
                Something to be aware of.
            </Callout>,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it("Tag", async () => {
        const { container } = render(<Tag intent="primary">Label</Tag>);
        expect(await axe(container)).toHaveNoViolations();
    });

    it("HTMLTable", async () => {
        const { container } = render(
            <HTMLTable>
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Role</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Ada</td>
                        <td>Engineer</td>
                    </tr>
                </tbody>
            </HTMLTable>,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it("Menu (menuitems + divider)", async () => {
        const { container } = render(
            <Menu aria-label="Actions">
                <MenuItem icon="cog" text="Settings" label="⌘," />
                <MenuDivider />
                <MenuItem icon="trash" text="Delete" intent="danger" />
            </Menu>,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it("Tabs", async () => {
        const { container } = render(
            <Tabs id="t" defaultSelectedTabId="a">
                <Tab id="a" title="First" panel={<p>First panel</p>} />
                <Tab id="b" title="Second" panel={<p>Second panel</p>} />
            </Tabs>,
        );
        expect(await axe(container)).toHaveNoViolations();
    });
});

// ---- Portaled overlays (rendered open; axe runs over the whole document) ----------------

describe("axe smoke — open overlays", () => {
    it("Dialog (titled)", async () => {
        render(
            <Dialog open title="Confirm" onOpenChange={() => {}}>
                <p>Dialog body content.</p>
            </Dialog>,
        );
        expect(await axe(document.body)).toHaveNoViolations();
    });

    it("MultistepDialog (wizard with a step rail)", async () => {
        render(
            <MultistepDialog open title="Create project" onOpenChange={() => {}}>
                <DialogStep id="one" title="First" panel={<p>First step panel.</p>} />
                <DialogStep id="two" title="Second" panel={<p>Second step panel.</p>} />
            </MultistepDialog>,
        );
        expect(await axe(document.body)).toHaveNoViolations();
    });

    it("Drawer (titled)", async () => {
        render(
            <Drawer open title="Details" onOpenChange={() => {}}>
                <p>Drawer body content.</p>
            </Drawer>,
        );
        expect(await axe(document.body)).toHaveNoViolations();
    });

    it("Alert (alertdialog)", async () => {
        render(
            <Alert open confirmButtonText="OK" cancelButtonText="Cancel" icon="warning-sign">
                Are you sure?
            </Alert>,
        );
        expect(await axe(document.body)).toHaveNoViolations();
    });

    it("Popover (named panel)", async () => {
        render(
            <Popover open ariaLabel="More options" content={<Menu aria-label="Options"><MenuItem text="One" /></Menu>}>
                <Button>Open</Button>
            </Popover>,
        );
        expect(await axe(document.body)).toHaveNoViolations();
    });
});

// ---- Combobox family, opened (the trigger surface must carry no disallowed ARIA) --------
// Suggest/MultiSelect anchor their popover to a roleless wrapper. If that wrapper is a Radix
// Popover.Trigger it gets stamped aria-haspopup/expanded/controls — invalid on a div with no
// role (aria-allowed-attr). These open the listbox and assert the whole tree is clean.

const FRUITS = ["Apple", "Banana", "Cherry"];

describe("axe smoke — combobox triggers (open)", () => {
    it("Suggest (open listbox)", async () => {
        render(
            <Suggest<string>
                items={FRUITS}
                inputValueRenderer={(i) => i}
                itemPredicate={(q, i) => i.toLowerCase().includes(q.toLowerCase())}
                onItemSelect={() => {}}
                itemRenderer={(item, { modifiers, handleClick }) => (
                    <MenuItem key={item} text={item} active={modifiers.active} onClick={handleClick} />
                )}
                inputProps={{ placeholder: "Search…" }}
            />,
        );
        screen.getByRole("combobox").focus();
        await screen.findByRole("listbox");
        expect(await axe(document.body)).toHaveNoViolations();
    });

    it("MultiSelect (open listbox)", async () => {
        render(
            <MultiSelect<string>
                items={FRUITS}
                selectedItems={[]}
                tagRenderer={(i) => i}
                itemPredicate={(q, i) => i.toLowerCase().includes(q.toLowerCase())}
                onItemSelect={() => {}}
                onRemove={() => {}}
                itemRenderer={(item, { modifiers, handleClick }) => (
                    <MenuItem key={item} text={item} active={modifiers.active} onClick={handleClick} />
                )}
            />,
        );
        screen.getByRole("combobox").focus();
        await screen.findByRole("listbox");
        expect(await axe(document.body)).toHaveNoViolations();
    });
});
