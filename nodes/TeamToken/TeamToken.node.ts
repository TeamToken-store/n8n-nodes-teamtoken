import {
	NodeApiError,
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

import { CRED } from './transport';
import { nodeProperties } from './descriptions';
import { route } from './actions/router';
import { loadOptions } from './methods/loadOptions';

/**
 * Thin node shell. Everything of substance lives in three separated concerns:
 *   - property descriptions  → ./descriptions/*  (ordered by ./descriptions/index)
 *   - HTTP transport         → ./transport
 *   - per-operation logic    → ./actions/*.execute (dispatched by ./actions/router)
 * This class owns only the n8n contract: the static description meta, the
 * loadOptions methods, and the per-item execute loop with continue-on-fail.
 *
 * The description object is kept inline (rather than imported) because the
 * community-nodes `icon-validation` rule requires a node's `description` to be an
 * object literal carrying `icon` directly — only the `properties` array is
 * factored out.
 */
export class TeamToken implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TeamToken',
		name: 'teamToken',
		icon: 'file:teamToken.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Generate images and video through TeamToken — one API key, 51 models',
		defaults: {
			name: 'TeamToken',
		},
		// Declares the node is invocable as an AI Agent tool (it turns a prompt
		// into an image/video). Required by the community-node standard for
		// main-I/O nodes.
		usableAsTool: true,
		// `NodeConnectionTypes.Main` (the runtime const) rather than the string
		// literal "main": mandated by the scan gate (node-connection-type-literal)
		// and type-checked. In n8n-workflow 2.x the singular `NodeConnectionType`
		// enum is type-only, but the plural `NodeConnectionTypes` object is a real
		// runtime value — verified community nodes run on 2.x, so this resolves at
		// load time.
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: CRED,
				required: true,
			},
		],
		properties: nodeProperties,
	};

	methods = {
		loadOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const produced = await route.call(this, resource, operation, i);
				returnData.push(...produced);
			} catch (error) {
				if (this.continueOnFail()) {
					// On an HTTP failure (e.g. an image 502 with a content-filter
					// reason) n8n's NodeApiError carries the upstream body in
					// `description`; prefer it over the generic `message` so the item
					// shows TeamToken's actual error text, then fall back to message.
					const e = error as { description?: string; message?: string };
					returnData.push({
						json: { error: e.description || e.message },
						pairedItem: { item: i },
					});
					continue;
				}
				// Wrap raw errors so the n8n UI keeps HTTP context (status/body) —
				// re-throwing the caught value loses it (require-node-api-error).
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
