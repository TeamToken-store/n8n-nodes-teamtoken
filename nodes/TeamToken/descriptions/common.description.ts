import type { INodeProperties } from 'n8n-workflow';

/** Properties shared by both resources. Ordered into the final `properties`
 * array by `descriptions/index.ts` — n8n renders the UI in that order, so the
 * assembly there is the single source of field ordering. */

export const resourceProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{ name: 'Image', value: 'image' },
		{ name: 'Video', value: 'video' },
	],
	default: 'image',
};

export const promptProperty: INodeProperties = {
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	typeOptions: { rows: 3 },
	displayOptions: {
		show: { operation: ['generate', 'edit', 'extend'] },
	},
	default: '',
	required: true,
	description: 'What to generate',
};

export const referenceImagesProperty: INodeProperties = {
	displayName: 'Reference Images',
	name: 'referenceImages',
	type: 'string',
	typeOptions: { rows: 2 },
	displayOptions: {
		show: {
			resource: ['image', 'video'],
			operation: ['generate', 'edit', 'extend'],
		},
	},
	default: '',
	description:
		'Optional reference image(s) for image-to-image, character consistency or image-to-video. Each may be a URL, a data-URL or bare base64. Put URLs one per line or comma-separated; put data-URLs / base64 one per line (they contain commas)',
};

export const jobIdProperty: INodeProperties = {
	displayName: 'Job ID',
	name: 'jobId',
	type: 'string',
	displayOptions: { show: { operation: ['getJob'] } },
	default: '',
	required: true,
	description: 'ID returned by a previous Generate/Edit/Extend call',
};

export const waitForCompletionProperty: INodeProperties = {
	displayName: 'Wait for Completion',
	name: 'waitForCompletion',
	type: 'boolean',
	displayOptions: { show: { operation: ['generate', 'edit', 'extend'] } },
	default: true,
	description: 'Whether to poll until the job finishes and return the result. If disabled, returns a job ID to fetch later with Get Job.',
};

export const maxWaitSecondsProperty: INodeProperties = {
	displayName: 'Max Wait (Seconds)',
	name: 'maxWaitSeconds',
	type: 'number',
	displayOptions: {
		show: { operation: ['generate', 'edit', 'extend'], waitForCompletion: [true] },
	},
	default: 300,
	description:
		'Give up polling after this many seconds and return the still-open job (video can take minutes)',
};

export const pollIntervalSecondsProperty: INodeProperties = {
	displayName: 'Poll Interval (Seconds)',
	name: 'pollIntervalSeconds',
	type: 'number',
	displayOptions: {
		show: { operation: ['generate', 'edit', 'extend'], waitForCompletion: [true] },
	},
	default: 5,
	description: 'How long to wait between status checks while polling',
};
