require "spec_helper"

describe CeleryScript::Corpus do
  let(:device) { FactoryBot.create(:device) }
  let(:corpus) { Sequence::Corpus }

  it "handles valid move_absolute blocks" do
    ok1 = CeleryScript::AstNode.new(**{
                                      kind: "move_absolute",
                                      args: {
                                        location: {
                                          kind: "coordinate",
                                          args: {
                                            x: 1,
                                            y: 2,
                                            z: 3,
                                          },
                                        },
                                        offset: {
                                          kind: "coordinate",
                                          args: {
                                            "x": 0,
                                            "y": 0,
                                            "z": 0,
                                          },
                                        },
                                        speed: 100,
                                      },
                                    })
    check1 = CeleryScript::Checker.new(ok1, corpus, device)
    expect(check1.valid?).to be_truthy

    ok2 = CeleryScript::AstNode.new(**{
                                      kind: "move_absolute",
                                      args: {
                                        location: {
                                          kind: "tool",
                                          args: { tool_id: FactoryBot.create(:tool).id },
                                        },
                                        offset: {
                                          kind: "coordinate",
                                          args: {
                                            "x": 0,
                                            "y": 0,
                                            "z": 0,
                                          },
                                        },
                                        speed: 100,
                                      },
                                    })
    check2 = CeleryScript::Checker.new(ok2, corpus, device)
    expect(check2.valid?).to be_truthy
  end

  it "kicks back invalid move_absolute nodes" do
    bad = CeleryScript::AstNode.new(**{
                                      kind: "move_absolute",
                                      args: {
                                        location: 42,
                                        speed: 100,
                                        offset: {
                                          kind: "coordinate",
                                          args: {
                                            "x": 0,
                                            "y": 0,
                                            "z": 0,
                                          },
                                        },
                                      },
                                    })
    check = CeleryScript::Checker.new(bad, corpus, device)
    expect(check.valid?).to be_falsey
    expect(check.error.message).to include("but got Integer")
    expect(check.error.message).to include("'location' within 'move_absolute'")
  end

  it "finds problems with nested nodes" do
    bad = CeleryScript::AstNode.new(**{
                                      kind: "move_absolute",
                                      args: {
                                        location: {
                                          kind: "tool",
                                          args: { tool_id: "PROBLEM!" }, # <= Invalid:
                                        },
                                        offset: {
                                          kind: "coordinate",
                                          args: { "x": 0, "y": 0, "z": 0 },
                                        },
                                        speed: 100,
                                      },
                                    })
    check = CeleryScript::Checker.new(bad, corpus, device)
    expect(check.valid?).to be_falsey
    expect(check.error.message).to include("but got String")
  end

  it "serializes into JSON" do
    result = JSON.parse(corpus.to_json)

    expect(result["version"]).to eq(Sequence::LATEST_VERSION)
    expect(result["args"]).to be_kind_of(Array)
    expect(result["nodes"]).to be_kind_of(Array)
    keys = result["nodes"].sample.keys.sort.map(&:to_sym)
    expect(keys).to eq([:allowed_args, :allowed_body_types, :docs, :name, :tags])
    expect(result["args"].sample.keys.sort).to eq(["allowed_values",
                                                   "name"])
  end

  it "Handles message_type validations for version 1" do
    # This test is __ONLY__ relevant for version 1.
    # Change / delete / update as needed.
    tree = CeleryScript::AstNode.new(**{
                                       "kind": "send_message",
                                       "args": {
                                         "message": "Hello, world!",
                                         "message_type": "wrong",
                                       },
                                       "body": [],
                                     })
    checker = CeleryScript::Checker.new(tree, corpus, device)
    expect(checker.error.message).to include("not a valid message_type")
  end

  it "Handles channel_name validations" do
    tree = CeleryScript::AstNode.new(**{
                                       "kind": "send_message",
                                       "args": {
                                         "message": "Hello, world!",
                                         "message_type": "fun",
                                       },
                                       "body": [
                                         {
                                           "kind": "channel",
                                           "args": { "channel_name": "wrong" },
                                         },
                                       ],
                                     })
    checker = CeleryScript::Checker.new(tree, corpus, device)
    expect(checker.error.message).to include("not a valid channel_name")
  end

  it "validates tool_ids" do
    ast = { "kind": "tool", "args": { "tool_id": 0 } }
    checker = CeleryScript::Checker.new(CeleryScript::AstNode.new(**ast),
                                        corpus,
                                        device)
    expect(checker.valid?).to be(false)
    expect(checker.error.message).to include("Tool #0 does not exist.")
  end

  it "Validates update_resource nodes" do
    ast = {
      kind: "update_resource",
      args: {
        "resource" => {
          kind: "resource",
          args: {
            "resource_type" => "Device",
            "resource_id" => 23, # Mutated to "0" later..
          },
        },
      },
      body: [
        {
          kind: "pair",
          args: {
            "label" => "mounted_tool_id",
            "value" => 1,
          },
        },
      ],
    }
    checker = CeleryScript::Checker
      .new(CeleryScript::AstNode.new(**ast), corpus, device)
    expect(checker.valid?).to be(true)
    device_id = checker.tree.args[:resource].args[:resource_id].value
    expect(device_id).to eq(device.id)
  end

  it "deprecates resource_updates" do
    fake_id = FactoryBot.create(:plant).id + 1
    expect(Plant.exists?(fake_id)).to be(false)
    ast = { "kind": "resource_update",
           "args": { "resource_type" => "Plant",
                     "resource_id" => fake_id,
                     "label" => "foo",
                     "value" => "Should Fail" } }
    hmm = CeleryScript::AstNode.new(**ast)
    expect(hmm.args.fetch(:resource_id).value).to eq(fake_id)
    checker = CeleryScript::Checker.new(hmm, corpus, device)
    expect(checker.valid?).to be(false)
    expect(checker.error.message).to eq(CeleryScriptSettingsBag::OLD_MARK_AS)
  end

  it "has enums" do
    args = [name = :foo, list = ["bar", "baz"], tpl = ["foo: %s bar: %s"]]
    c = CeleryScript::Corpus.new.enum(*args)
    json = c.as_json
    enums = json.fetch(:enums)
    expect(enums.length).to eq(1)
    expect(enums.first.fetch("name")).to eq(name)
    expect(enums.first.fetch("allowed_values")).to eq(list)
  end

  it "has values" do
    args = [name = :whatever, list = [Symbol, Hash]]
    c = CeleryScript::Corpus.new.value(*args)
    json = c.as_json
    values = json.fetch(:values)
    expect(values.length).to eq(1)
    expect(values.first.fetch("name")).to eq(name)
    expect(values.first.keys.length).to eq(1)
  end

  it "assigns tags and documentation to nodes" do
    c = CeleryScript::Corpus.new.node("wonderful",
                                      args: [],
                                      body: [],
                                      tags: ["great"],
                                      docs: "spectacular")
    json = c.as_json
    values = json.fetch(:nodes)
    expect(values.length).to eq(1)
    value = values.first
    expect(value.fetch("tags").first).to eq("great")
    expect(value.fetch("docs")).to eq("spectacular")
  end

  it "sets a MAX_WAIT_MS limit for `wait` nodes" do
    bad = CeleryScript::AstNode.new(**{
                                      kind: "wait",
                                      args: { milliseconds: CeleryScriptSettingsBag::MAX_WAIT_MS + 10 },
                                    })
    check = CeleryScript::Checker.new(bad, corpus, device)
    expect(check.valid?).to be_falsey
    expect(check.error.message).to include("cannot exceed 3 minutes")
  end

  it "allows valid `point_group` nodes" do
    device.auto_sync_transaction do
      pg = PointGroups::Create.run!(device: device,
                                    name: "cs checks",
                                    point_ids: [])
      bad = CeleryScript::AstNode.new(**{
                                        kind: "point_group",
                                        args: { point_group_id: pg.id },
                                      })
      check = CeleryScript::Checker.new(bad, corpus, device)
      expect(check.valid?).to be true
    end
  end

  it "validates bogus `point_group` nodes" do
    device.auto_sync_transaction do
      pg = PointGroups::Create.run!(device: device,
                                    name: "cs checks",
                                    point_ids: [])
      bad = CeleryScript::AstNode.new(**{
                                        kind: "point_group",
                                        args: {
                                          point_group_id: 999,
                                        },
                                      })
      check = CeleryScript::Checker.new(bad, corpus, device)
      expect(check.valid?).to be false
    end
  end

  it "disallows invalid `point_group` nodes" do
    device.auto_sync_transaction do
      bad = CeleryScript::AstNode.new(**{
                                        kind: "point_group",
                                        args: { point_group_id: -1 },
                                      })
      check = CeleryScript::Checker.new(bad, corpus, device)
      expect(check.valid?).to be false
      expect(check.error.message).to eq("Can't find PointGroup with id of -1")
    end
  end
end
