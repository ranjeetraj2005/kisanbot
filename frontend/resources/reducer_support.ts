import {
  ResourceName, SpecialStatus, TaggedResource, TaggedSequence,
} from "farmbot";
import { combineReducers } from "redux";
import { helpReducer as help } from "../help/reducer";
import { designer as farm_designer } from "../farm_designer/reducer";
import { photosReducer as photos } from "../photos/reducer";
import { farmwareReducer as farmware } from "../farmware/reducer";
import { regimensReducer as regimens } from "../regimens/reducer";
import { sequenceReducer as sequences } from "../sequences/reducer";
import { RestResources, ResourceIndex } from "./interfaces";
import { isTaggedResource } from "./tagged_resources";
import { arrayWrap, arrayUnwrap } from "./util";
import {
  sanitizeNodes,
} from "../sequences/locals_list/sanitize_nodes";
import {
  selectAllFarmEvents,
  selectAllPinBindings,
  findByKindAndId,
  selectAllLogs,
  selectAllRegimens,
  selectAllFolders,
  selectAllSequences,
} from "./selectors_by_kind";
import { ExecutableType } from "farmbot/dist/resources/api_resources";
import { betterCompact, unpackUUID } from "../util";
import { createSequenceMeta } from "./sequence_meta";
import { alertsReducer as alerts } from "../messages/reducer";
import { warning } from "../toast/toast";
import { ReduxAction } from "../redux/interfaces";
import { ActionHandler } from "../redux/generate_reducer";
import { get } from "lodash";
import { Actions } from "../constants";
import { getFbosConfig } from "./getters";
import { ingest, PARENTLESS as NO_PARENT } from "../folders/data_transfer";
import {
  FolderNode, FolderMeta, FolderNodeTerminal, FolderNodeMedial,
} from "../folders/interfaces";
import { climb } from "../folders/climb";

export function findByUuid(index: ResourceIndex, uuid: string): TaggedResource {
  const x = index.references[uuid];
  if (x && isTaggedResource(x)) {
    return x;
  } else {
    throw new Error("BAD UUID- CANT FIND RESOURCE: " + uuid);
  }
}

type IndexerCallback = (self: TaggedResource, index: ResourceIndex) => void;
export interface Indexer {
  /** Resources entering index */
  up: IndexerCallback;
  /** Resources leaving index */
  down: IndexerCallback;
}

export const reindexFolders = (i: ResourceIndex) => {
  const folders = betterCompact(selectAllFolders(i)
    .map((x): FolderNode | undefined => {
      const { body } = x;
      if (typeof body.id === "number") {
        const fn: FolderNode = { id: body.id, ...body };
        return fn;
      }
    }));
  const allSequences = selectAllSequences(i);

  const oldMeta = i.sequenceFolders.localMetaAttributes;
  /** Open folder edit mode when adding a new folder (& not during init all). */
  const editing = !!oldMeta[-1];
  const localMetaAttributes: Record<number, FolderMeta> = {};
  folders.map(x => {
    localMetaAttributes[x.id] = {
      ...(oldMeta[x.id] || { editing }),
      sequences: [], // Clobber and re-init
    };
  });

  allSequences.map((s) => {
    const { folder_id } = s.body;
    const parentId = folder_id || NO_PARENT;

    if (!localMetaAttributes[parentId]) {
      localMetaAttributes[parentId] = {
        sequences: [],
        open: true,
        editing: false
      };
    }
    localMetaAttributes[parentId].sequences.push(s.uuid);
  });

  const { searchTerm } = i.sequenceFolders;

  /** Perform tree search for search term O(n)
   * complexity plz send help. */
  if (searchTerm) {
    const sequenceHits = new Set<string>();
    const folderHits = new Set<number>();

    climb(i.sequenceFolders.folders, (node) => {
      node.content.map(x => {
        const s = i.references[x];
        if (s &&
          s.kind == "Sequence" &&
          s.body.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          sequenceHits.add(s.uuid);
          folderHits.add(node.id);
        }
      });
      const nodes: (FolderNodeMedial | FolderNodeTerminal)[] =
        node.children || [];
      nodes.map(_x => { });
    });
  }

  i.sequenceFolders = {
    folders: ingest({ folders, localMetaAttributes }),
    localMetaAttributes,
    searchTerm: searchTerm,
    filteredFolders: searchTerm
      ? i.sequenceFolders.filteredFolders
      : undefined
  };

};

export const folderIndexer: IndexerCallback = (r, i) => {
  if (r.kind === "Folder" || r.kind === "Sequence") {
    reindexFolders(i);
  }
};

const SEQUENCE_FOLDERS: Indexer = { up: folderIndexer, down: () => { } };

const REFERENCES: Indexer = {
  up: (r, i) => i.references[r.uuid] = r,
  down: (r, i) => delete i.references[r.uuid],
};

const ALL: Indexer = {
  up: (r, s) => s.all[r.uuid] = true,
  down: (r, i) => delete i.all[r.uuid],
};

const BY_KIND: Indexer = {
  up(r, i) { i.byKind[r.kind][r.uuid] = r.uuid; },
  down(r, i) { delete i.byKind[r.kind][r.uuid]; },
};

const BY_KIND_AND_ID: Indexer = {
  up: (r, i) => {
    if (r.body.id) {
      i.byKindAndId[joinKindAndId(r.kind, r.body.id)] = r.uuid;
    }
  },
  down(r, i) {
    delete i.byKindAndId[joinKindAndId(r.kind, r.body.id)];
    delete i.byKindAndId[joinKindAndId(r.kind, 0)];
  },
};

export function updateSequenceUsageIndex(
  myUuid: string, ids: number[], i: ResourceIndex) {
  ids.map(id => {
    const uuid = i.byKindAndId[joinKindAndId("Sequence", id)];
    if (uuid) { // `undefined` usually means "not ready".
      const inUse = i.inUse["Sequence.Sequence"][uuid] || {};
      i.inUse["Sequence.Sequence"][uuid] = { ...inUse, ...{ [myUuid]: true } };
    }
  });
}

export const updateOtherSequenceIndexes =
  (tr: TaggedSequence, i: ResourceIndex) => {
    i.references[tr.uuid] = tr;
    i.sequenceMetas[tr.uuid] = createSequenceMeta(i, tr);
  };

const reindexSequences = (i: ResourceIndex) => (s: TaggedSequence) => {
  // STEP 1: Sanitize nodes, tag them with unique UUIDs (for React),
  //         collect up sequence_id's, etc. NOTE: This is CPU expensive,
  //         so if you need to do tree traversal, do it now.
  const { thisSequence, callsTheseSequences } = sanitizeNodes(s.body);
  // STEP 2: Add sequence to index.references, update variable reference
  //         indexes
  updateSequenceUsageIndex(s.uuid, callsTheseSequences, i);
  // Step 3: Update the in_use stats for Sequence-to-Sequence usage.
  updateOtherSequenceIndexes({ ...s, body: thisSequence }, i);
};

const reindexAllSequences = (i: ResourceIndex) => {
  i.inUse["Sequence.Sequence"] = {};
  const mapper = reindexSequences(i);
  betterCompact(Object.keys(i.byKind["Sequence"]).map(uuid => {
    const resource = i.references[uuid];
    return (resource?.kind == "Sequence") ? resource : undefined;
  })).map(mapper);
};

export function reindexAllFarmEventUsage(i: ResourceIndex) {
  i.inUse["Regimen.FarmEvent"] = {};
  i.inUse["Sequence.FarmEvent"] = {};
  const whichOne: Record<ExecutableType, typeof i.inUse["Regimen.FarmEvent"]> = {
    "Regimen": i.inUse["Regimen.FarmEvent"],
    "Sequence": i.inUse["Sequence.FarmEvent"],
  };

  // Which FarmEvents use which resource?
  betterCompact(selectAllFarmEvents(i)
    .map(fe => {
      const { executable_type, executable_id } = fe.body;
      const { uuid } = findByKindAndId(i, executable_type, executable_id);
      return { exe_type: executable_type, exe_uuid: uuid, fe_uuid: fe.uuid };
    }))
    .map(({ exe_type, exe_uuid, fe_uuid }) => {
      whichOne[exe_type] = whichOne[exe_type] || {};
      whichOne[exe_type][exe_uuid] = whichOne[exe_type][exe_uuid] || {};
      whichOne[exe_type][exe_uuid][fe_uuid] = true;
    });
}

export const INDEXERS: Indexer[] = [
  REFERENCES,
  ALL,
  BY_KIND,
  BY_KIND_AND_ID,
  SEQUENCE_FOLDERS,
];

type IndexerHook = Partial<Record<TaggedResource["kind"], Reindexer>>;
type Reindexer = (i: ResourceIndex, strategy: "ongoing" | "initial") => void;

export function joinKindAndId(kind: ResourceName, id: number | undefined) {
  return `${kind}.${id || 0}`;
}

/** Any reducer that uses TaggedResources (or UUIDs) must live within the
 * resource reducer. Failure to do so can result in stale UUIDs, referential
 * integrity issues and other bad stuff. The variable below contains all
 * resource consuming reducers. */
const consumerReducer = combineReducers<RestResources["consumers"]>({
  regimens,
  sequences,
  farm_designer,
  photos,
  farmware,
  help,
  alerts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

/** The resource reducer must have the first say when a resource-related action
 * fires off. Afterwards, sub-reducers are allowed to make sense of data
 * changes. A common use case for sub-reducers is to listen for
 * `DESTROY_RESOURCE_OK` and clean up stale UUIDs. */
export const afterEach = (state: RestResources, a: ReduxAction<unknown>) => {
  state.consumers = consumerReducer({
    sequences: state.consumers.sequences,
    regimens: state.consumers.regimens,
    farm_designer: state.consumers.farm_designer,
    photos: state.consumers.photos,
    farmware: state.consumers.farmware,
    help: state.consumers.help,
    alerts: state.consumers.alerts
  }, a);
  return state;
};

/** Helper method to change the `specialStatus` of a resource in the index */
export const mutateSpecialStatus =
  (uuid: string, index: ResourceIndex, status = SpecialStatus.SAVED) => {
    findByUuid(index, uuid).specialStatus = status;
  };

export function initResourceReducer(s: RestResources,
  { payload }: ReduxAction<TaggedResource>): RestResources {
  indexUpsert(s.index, [payload], "ongoing");
  return s;
}

const BEFORE_HOOKS: IndexerHook = {
  Log(_index, strategy) {
    // IMPLEMENTATION DETAIL: When the app downloads a *list* of logs, we
    // replaces the entire logs collection.
    (strategy === "initial") &&
      selectAllLogs(_index).map(log => indexRemove(_index, log));
  },
};

const AFTER_HOOKS: IndexerHook = {
  FbosConfig: (i) => {
    const conf = getFbosConfig(i);

    if (conf?.body.boot_sequence_id) {
      const { boot_sequence_id } = conf.body;
      const tracker = i.inUse["Sequence.FbosConfig"];
      const uuid = i.byKindAndId[joinKindAndId("Sequence", boot_sequence_id)];
      if (uuid) {
        tracker[uuid] = tracker[uuid] || {};
        tracker[uuid][conf.uuid] = true;
      }
    } else {
      i.inUse["Sequence.FbosConfig"] = {};
    }
  },
  PinBinding: (i) => {
    i.inUse["Sequence.PinBinding"] = {};
    const tracker = i.inUse["Sequence.PinBinding"];
    selectAllPinBindings(i)
      .map(pinBinding => {
        if (pinBinding.body.binding_type === "standard") {
          const { sequence_id } = pinBinding.body;
          const uuid = i.byKindAndId[joinKindAndId("Sequence", sequence_id)];
          if (uuid) {
            tracker[uuid] = tracker[uuid] || {};
            tracker[uuid][pinBinding.uuid] = true;
          }
        }
      });
  },
  FarmEvent: reindexAllFarmEventUsage,
  Sequence: reindexAllSequences,
  Regimen: (i) => {
    i.inUse["Sequence.Regimen"] = {};
    const tracker = i.inUse["Sequence.Regimen"];
    selectAllRegimens(i)
      .map(reg => {
        reg.body.regimen_items.map(ri => {
          const sequence = findByKindAndId(i, "Sequence", ri.sequence_id);
          tracker[sequence.uuid] = tracker[sequence.uuid] || {};
          tracker[sequence.uuid][reg.uuid] = true;
        });
      });
  }
};

const ups = INDEXERS.map(x => x.up);
const downs = INDEXERS.map(x => x.down).reverse();

type UpsertStrategy =
  /** Do not throw away pre-existing resources. */
  | "ongoing"
  /** Replace everything in the index. */
  | "initial";

type IndexUpsert = (db: ResourceIndex,
  resources: TaggedResource[],
  strategy: UpsertStrategy) => void;
export const indexUpsert: IndexUpsert = (db, resources, strategy) => {
  if (resources.length == 0) {
    return;
  }
  const { kind } = arrayUnwrap(resources);
  // Clean up indexes (if needed)
  const before = BEFORE_HOOKS[kind];
  before?.(db, strategy);

  // Run indexers
  ups.map(callback => {
    resources.map(resource => callback(resource, db));
  });

  // Finalize indexing (if needed)
  const after = AFTER_HOOKS[kind];
  after?.(db, strategy);
};

export function indexRemove(db: ResourceIndex, resource: TaggedResource) {
  downs.map(callback => arrayWrap(resource).map(r => callback(r, db)));
  // Finalize indexing (if needed)
  const after = AFTER_HOOKS[resource.kind];
  after?.(db, "ongoing");
}

export const beforeEach = (state: RestResources,
  action: ReduxAction<unknown>,
  handler: ActionHandler<RestResources, unknown>) => {
  const { byKind, references } = state.index;
  const w = references[Object.keys(byKind.WebAppConfig)[0]];
  const readOnly = w &&
    w.kind == "WebAppConfig" &&
    w.body.user_interface_read_only_mode;
  if (!readOnly) {
    return handler(state, action);
  }
  const fail = (place: string) => {
    warning(`(${place}) Can't modify account data when in read-only mode.`);
  };
  const { kind } = unpackUUID(get(action, "payload.uuid", "x.y.z"));

  switch (action.type) {
    case Actions.EDIT_RESOURCE:
      if (kind === "WebAppConfig") {
        // User is trying to exit read-only mode.
        return handler(state, action);
      } else {
        fail("1");
        return state;
      }
    case Actions.SAVE_RESOURCE_START:
    case Actions.DESTROY_RESOURCE_START:
      if (kind !== "WebAppConfig") {
        // User is trying to make HTTP requests.
        fail("3");
      }
      // User is trying to exit read-only mode.
      return handler(state, action);
    case Actions.BATCH_INIT:
    case Actions.INIT_RESOURCE:
    case Actions.OVERWRITE_RESOURCE:
      fail("2");
      return state;
    default:
      return handler(state, action);
  }
};
