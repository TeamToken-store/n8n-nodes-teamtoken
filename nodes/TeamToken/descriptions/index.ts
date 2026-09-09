import type { INodeProperties } from 'n8n-workflow';

import * as common from './common.description';
import * as image from './image.description';
import * as video from './video.description';

/**
 * The node's `properties`, assembled in the exact order n8n renders them in the
 * UI — this list is the single source of field ordering. The image/video
 * operation and model pickers interleave (image-op, video-op, image-model,
 * video-model), so the array is an explicit ordering, not a concatenation of the
 * per-resource modules.
 *
 * Only the `properties` array is factored out here; the node's static meta
 * (icon, subtitle, inputs/outputs, credentials…) stays inline in the node class
 * because the community-nodes `icon-validation` rule requires a node's
 * `description` to be an inline object literal carrying the `icon` field.
 */
export const nodeProperties: INodeProperties[] = [
	common.resourceProperty,
	image.imageOperations,
	video.videoOperations,
	image.imageModel,
	video.videoModel,
	common.promptProperty,
	video.videoRefVideoJobId,
	common.referenceImagesProperty,
	video.videoReferenceVideo,
	common.jobIdProperty,
	common.waitForCompletionProperty,
	common.maxWaitSecondsProperty,
	common.pollIntervalSecondsProperty,
	image.imageOptions,
	video.videoOptions,
];
