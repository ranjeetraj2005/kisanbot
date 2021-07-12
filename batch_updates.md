# Support Table

Not all resources support the experimental resource API.

|Resource               | Delete  | Update / Insert|
|-----------------------|---------|----------------|
| FarmEvent             | :heart: | :broken_heart: |
| FarmwareInstallation  | :heart: | :broken_heart: |
| Image                 | :heart: | :broken_heart: |
| Log                   | :heart: | :broken_heart: |
| Peripheral            | :heart: | :broken_heart: |
| PinBinding            | :heart: | :broken_heart: |
| PlantTemplate         | :heart: | :broken_heart: |
| Point                 | :heart: | :broken_heart: |
| Regimen               | :heart: | :broken_heart: |
| SavedGarden           | :heart: | :broken_heart: |
| Sensor                | :heart: | :broken_heart: |
| SensorReading         | :heart: | :broken_heart: |
| Sequence              | :heart: | :broken_heart: |
| Tool                  | :heart: | :broken_heart: |
| WebcamFeed            | :heart: | :broken_heart: |

# Step 1: Send the Update

Send an MQTT message in the format of:

```
bot/device_<id>/resources_v0/<action>/<resource type>/<Transaction UUID>/<resource_id or 0>
```

Example 1-1:

```
bot/device_3/resources_v0/destroy/Sequence/2/123-456
```

NOTES:

 * `<Transaction UUID>` can be any user defined string. Ensure that the string is unique. We recommend using UUIDs.
 * `<resource_id>` This is the `.id` property of the resource you are deleting.
 * `<action>` Only `destroy` is supported as of July 2018.
 * `<resource type>` See "resource" column of table above. **Case sensitive**.

**For deletion messages** the body of the message is unimportant and is discarded by the server.

# Step 2(A): Handle Failure

If your message is malformed or the server was unable to complete the request, you will receive an error message on the following MQTT channel:

```
bot/device_<id>/from_api
```

The message will take the same format as RPC errors:

```
{
  "kind": "rpc_error",
  "args": { "label": "THE UUID YOU GAVE THE SERVER" },
  "body": [
    {
      "kind": "explanation",
      "args": { "message": "Human readable explanation message" }
    }
  ]
}
```

# Step 2(B): Handle Success

If successful, an `rpc_ok` CeleryScript node will be streamed to the following MQTT channel:

```
bot/device_<id>/from_api
```

**This is not a JSON resource.** It is merely an indication that the server has accepted the request and processed it. The resource itself will be streamed over the `auto_sync`* channel.
