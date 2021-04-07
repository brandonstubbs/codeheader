import * as vscode from "vscode";

const languageComment = new Map([
  // language particular comments
  ["terraform", "#"],
]);

export function activate(context: vscode.ExtensionContext) {
  let codeheader = vscode.commands.registerCommand("codeheader.comment", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return; // There is no active editor, we have nothing to do 😢
    }

    const document = editor.document;

    let selection = editor.selection;
    if (selection.isEmpty) {
      let currentLineStart = new vscode.Position(selection.active.line, 0);
      let currentLineEnd = new vscode.Position(
        selection.active.line,
        document.lineAt(selection.active.line).range.end.character
      );
      selection = new vscode.Selection(currentLineStart, currentLineEnd);
    } else {
      selection = editor.selection;
    }

    const title = document.getText(selection);

    const rulerConfig:
      | Array<number>
      | undefined = vscode.workspace.getConfiguration("editor").get("rulers");

    const sym = languageComment.get(document.languageId) || ";";
    const dblSym = sym + sym;
    const normTitle = title.toUpperCase().split("").join(" ");
    const decorTitle = "----==| " + normTitle + " |==----";
    const lineLength =
      rulerConfig && rulerConfig.length > 0 ? rulerConfig[0] : 80;
    const spaceL = Math.floor((lineLength - decorTitle.length - 4) / 2);
    const spaceR = Math.ceil((lineLength - decorTitle.length - 4) / 2);

    if (decorTitle.length > lineLength - 4) {
      vscode.window.showErrorMessage(
        "Your title is longer than " +
          (lineLength - 20) / 2 + // 20 Includes the symbols and decoration around the title
          " characters." +
          "You can either create a shorter title or increase your editor ruler length"
      );
      return;
    }

    // prettier-ignore
    const codeComment =
			 	sym.repeat(lineLength) + "\n" +
			 	dblSym + " ".repeat(lineLength - 4) + dblSym + "\n" +
			 	dblSym + " ".repeat(spaceL) + decorTitle + " ".repeat(spaceR) + dblSym + "\n" +
				dblSym + " ".repeat(lineLength - 4) + dblSym + "\n" +
			  sym.repeat(lineLength) + "\n";

    editor
      .edit((editBuilder) => {
        editBuilder.replace(selection, codeComment);
      })
      .then((success) => {
        // We remove any highlighting over the text
        let position = editor.selection.end;
        editor.selection = new vscode.Selection(position, position);
      });
  });

  context.subscriptions.push(codeheader);
}
