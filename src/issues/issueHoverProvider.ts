/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { PullRequestManager } from '../github/pullRequestManager';
import { getIssue, ISSUE_OR_URL_EXPRESSION, ParsedIssue, parseIssueExpressionOutput, issueMarkdown } from './util';
import { StateManager } from './stateManager';

export class IssueHoverProvider implements vscode.HoverProvider {
	constructor(private manager: PullRequestManager, private stateManager: StateManager) { }

	provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover | undefined> {
		let wordPosition = document.getWordRangeAtPosition(position, ISSUE_OR_URL_EXPRESSION);
		if (wordPosition && (wordPosition.start.character > 0)) {
			wordPosition = new vscode.Range(new vscode.Position(wordPosition.start.line, wordPosition.start.character - 1), wordPosition.end);
			const word = document.getText(wordPosition);
			const match = word.match(ISSUE_OR_URL_EXPRESSION);
			const tryParsed = parseIssueExpressionOutput(match);
			if (tryParsed && match) {
				return this.createHover(match[0], tryParsed, wordPosition);
			}
		} else {
			return undefined;
		}
	}

	private async createHover(value: string, parsed: ParsedIssue, range: vscode.Range): Promise<vscode.Hover | undefined> {
		const issue = await getIssue(this.stateManager, this.manager, value, parsed);
		if (issue) {
			return new vscode.Hover(issueMarkdown(issue), range);
		} else {
			return undefined;
		}
	}
}