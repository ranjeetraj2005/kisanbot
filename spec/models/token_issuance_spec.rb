require "spec_helper"

describe TokenIssuance do
  it "notifies admins about failed message queue evictions" do
    allow(Transport::Mgmt)
      .to receive(:connections).and_raise(Faraday::ConnectionFailed, "rspec")
    allow(Rollbar).to receive(:error).and_return("OK")
    TokenIssuance.new(device_id: 8).maybe_evict_clients
  end

  it "clears out old stuff via #clean_old_tokens" do
    TokenIssuance.destroy_all
    TokenIssuance.create(device_id: FactoryBot.create(:device).id,
                         exp: 1.year.ago.to_i,
                         jti: "WOW")
    expect(TokenIssuance.count).to eq(1)
    TokenIssuance.clean_old_tokens
    expect(TokenIssuance.count).to eq(0)
  end


  it "reports failed evictions" do
    msg       = "Failed to evict clients on token revocation"
    method_   = :close_connections_for_username
    exception = [Timeout::Error, "!"]
    allow(Transport::Mgmt).to receive(method_).and_raise(*exception)
    expect(Rollbar).to receive(:error).with(msg)

    device_id = FactoryBot.create(:device).id
    t         = TokenIssuance.create(device_id: device_id,
                                     exp:       1.year.ago.to_i,
                                     jti:       "WOW")
    t.maybe_evict_clients
  end
end
