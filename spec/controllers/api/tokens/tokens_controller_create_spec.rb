require "spec_helper"

describe Api::TokensController do
  include Devise::Test::ControllerHelpers

  describe "#create" do
    let(:user) { FactoryBot.create(:user, password: "password") }
    it "resets inactivity warnings on login" do
      user.update!(inactivity_warning_sent_at: 10.days.ago)
      payload = { user: { email: user.email, password: "password" } }
      post :create, body: payload.to_json
      token = json[:token][:unencoded]
      expect(token[:iss].last).not_to eq("/") # Trailing slashes are BAD!
      expect(token[:iss]).to include($API_URL)
      expect(user.reload.inactivity_warning_sent_at).to eq(nil)
    end

    it "reminds users to verify accounts" do
      const_reassign(User, :SKIP_EMAIL_VALIDATION, false) do
        user.update!(confirmed_at: nil)
        payload = { user: { email: user.email, password: "password" } }
        post :create, params: payload, body: {}.to_json
        expect(json).to eq({ :error => "You can't perform that action. Verify account first" })
        expect(response.status).to eq(403)
      end
    end

    it "creates a new token" do
      payload = { user: { email: user.email, password: "password" } }
      post :create, body: payload.to_json
      token = json[:token][:unencoded]
      expect(token[:iss].last).not_to eq("/") # Trailing slashes are BAD!
      expect(token[:iss]).to include($API_URL)
    end

    it "handles bad params" do
      err_msg = Api::TokensController::NO_USER_ATTR
      payload = { user: "NOPE!" }
      post :create, body: payload.to_json
      expect(json[:error]).to include(err_msg)
    end

    it "does not bump last_saw_api if it is not a bot" do
      payload = { user: { email: user.email, password: "password" } }
      before = user.device.last_saw_api
      post :create, body: payload.to_json
      after = user.device.reload.last_saw_api
      expect(before).to eq(after)
    end

    it "bumps last_saw_api and issues BOT AUD when it is a bot" do
      ua = "FARMBOTOS/111.111.111 (RPI3) RPI3 (111.111.111)"
      allow(request).to receive(:user_agent).and_return(ua)
      request.env["HTTP_USER_AGENT"] = ua
      payload = { user: { email: user.email, password: "password" } }
      before = user.device.last_saw_api || Time.now
      post :create, body: payload.to_json
      after = user.device.reload.last_saw_api
      expect(after).to be
      expect(after).to be > before
      expect(json.dig(:token, :unencoded, :aud)).to be
      expect(json.dig(:token, :unencoded, :aud)).to eq AbstractJwtToken::BOT_AUD
      expect(user.device.fbos_version).to eq("111.111.111")
    end

    it "issues a 'HUMAN' AUD to browsers" do
      payload = { user: { email: user.email, password: "password" } }
      allow_any_instance_of(Api::TokensController).to receive(:xhr?).and_return(true)
      post :create, body: payload.to_json
      expect(json.dig(:token, :unencoded, :aud)).to be
      expect(json.dig(:token, :unencoded, :aud)).to eq(AbstractJwtToken::HUMAN_AUD)
    end

    it "issues a '?' AUD to all others" do
      payload = { user: { email: user.email, password: "password" } }
      post :create, body: payload.to_json
      expect(json.dig(:token, :unencoded, :aud)).to be
      expect(json.dig(:token, :unencoded, :aud)).to eq(AbstractJwtToken::UNKNOWN_AUD)
    end
  end
end
