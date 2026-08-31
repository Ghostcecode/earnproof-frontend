import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ArtifactExport } from "@/components/proofs/artifact-export";
import type { ArtifactExportPlan } from "@/lib/credentials/export";

jest.mock("@/lib/credentials/export", () => ({
  copyTextToClipboard: jest.fn(),
  downloadTextFile: jest.fn(),
}));

import {
  copyTextToClipboard,
  downloadTextFile,
} from "@/lib/credentials/export";

const mockedCopy = jest.mocked(copyTextToClipboard);
const mockedDownload = jest.mocked(downloadTextFile);

const plan: ArtifactExportPlan = {
  filename: "earnproof-credential.json",
  includedFields: [
    "credential.id",
    "credential.type",
    "credential.proof.signature",
  ],
  warnings: [],
  body: JSON.stringify({
    credential: {
      id: "credential-123",
      type: "IncomeCredential",
    },
  }),
  mimeType: "application/json",
};

describe("ArtifactExport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when no export plan exists", () => {
    const { container } = render(
      <ArtifactExport plan={null} title="Export credential" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("opens the export confirmation dialog", () => {
    render(
      <ArtifactExport
        plan={plan}
        title="Export credential"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Export credential" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Confirm export" }),
    ).toBeInTheDocument();

    expect(screen.getByText("credential.id")).toBeInTheDocument();
    expect(screen.getByText("credential.proof.signature")).toBeInTheDocument();
  });

  it("displays disclosure warnings", () => {
    const warningPlan: ArtifactExportPlan = {
      ...plan,
      warnings: [
        {
          field: "amount",
          message: "This export includes optional amount disclosure.",
        },
      ],
    };

    render(
      <ArtifactExport
        plan={warningPlan}
        title="Export credential"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Export credential" }),
    );

    expect(
      screen.getByText("This export includes optional amount disclosure."),
    ).toBeInTheDocument();
  });

  it("downloads the supplied export plan", () => {
    render(
      <ArtifactExport
        plan={plan}
        title="Export credential"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Export credential" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    expect(mockedDownload).toHaveBeenCalledWith(plan);

    expect(
      screen.getByText("Download started."),
    ).toBeInTheDocument();
  });

  it("handles download failures without exposing credential contents", () => {
    mockedDownload.mockImplementation(() => {
      throw new Error("download failed");
    });

    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <ArtifactExport
        plan={plan}
        title="Export credential"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Export credential" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent(
      "Download failed. Check browser permissions and try again.",
    );

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("credential-123"),
    );

    consoleError.mockRestore();
  });

  it("copies the export body and reports success", async () => {
    mockedCopy.mockResolvedValue(undefined);

    render(
      <ArtifactExport
        plan={plan}
        title="Export credential"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Export credential" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(mockedCopy).toHaveBeenCalledWith(plan.body);
    });

    expect(screen.getByText("Copied to clipboard.")).toBeInTheDocument();
  });

  it("handles clipboard failures", async () => {
    mockedCopy.mockRejectedValue(new Error("clipboard unavailable"));

    render(
      <ArtifactExport
        plan={plan}
        title="Export credential"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Export credential" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Clipboard copy was blocked.",
      );
    });
  });

  it("provides accessible dialog and action controls", () => {
    render(
      <ArtifactExport
        plan={plan}
        title="Export credential"
      />,
    );

    const openButton = screen.getByRole("button", {
      name: "Export credential",
    });

    expect(openButton).toHaveAttribute("type", "button");

    fireEvent.click(openButton);

    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby");

    expect(
      screen.getByRole("button", { name: "Copy" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Download" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Cancel" }),
    ).toBeInTheDocument();
  });

  it("closes the dialog when Cancel is clicked", () => {
    render(
      <ArtifactExport
        plan={plan}
        title="Export credential"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Export credential" }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
