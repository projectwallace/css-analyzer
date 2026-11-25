export {
	get_supports_browserhacks,
	get_media_browserhacks,
	get_container_query_name,
} from './atrules.ts'
export { get_keyframes_name, get_layer_names } from './names.ts'
export {
	get_static_features,
	get_query_bounds,
	type StaticFeature,
	type QueryBounds,
	find_contradiction,
	type Contradiction,
} from './conditions.ts'
export { get_feature_bounds, type FeatureBound } from './feature-bounds.ts'
export {
	validate_property_registration,
	type PropertyRegistrationIssue,
} from './property-registration.ts'
