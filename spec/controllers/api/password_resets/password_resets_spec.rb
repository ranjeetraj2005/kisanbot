require "spec_helper"
describe Api::PasswordResetsController do
  include Devise::Test::ControllerHelpers

  describe "#create" do
    let(:user) { FactoryBot.create(:user) }

    it "resets password for a user" do
      params = { email: user.email }

      old_email_count = ActionMailer::Base.deliveries.length
      run_jobs_now do
        post :create, body: params.to_json
        expect(response.status).to eq(200)
        expect(ActionMailer::Base.deliveries.length).to be > old_email_count
        message = last_email.to_s
        expect(message).to include("password reset")
      end
    end

    it "resets password using a reset token" do
      params = { password: "xpassword123",
                password_confirmation: "xpassword123",
                fbos_version: Gem::Version.new("999.9.9"),
                id: PasswordResetToken
        .issue_to(user)
        .encoded }
      put :update, body: params.to_json, format: :json
      expect(user
        .reload
        .valid_password?(params[:password])).to eq(true)
      expect(response.status).to eq(200)
      expect(json.keys).to include(:token)
      expect(json.keys).to include(:user)
    end

    it "disallows short passwords" do
      params = { password: "xpass",
                password_confirmation: "xpass",
                fbos_version: Gem::Version.new("999.9.9"),
                id: PasswordResetToken
        .issue_to(user)
        .encoded }
      put :update, body: params.to_json, format: :json
      expect(user
        .reload
        .valid_password?(params[:password])).to eq(false)
      expect(response.status).to eq(422)
      expect(json[:password]).to include("too short")
    end

    it "handles token expiration" do
      token = PasswordResetToken
        .issue_to(user, **{ exp: Time.now.yesterday.to_i })
        .encoded

      params = { password: "xpassword123",
                 password_confirmation: "xpassword123",
                 id: token }

      put :update, body: params.to_json, format: :json
      expect(response.status).to eq(422)
      expect(user.reload.valid_password?(params[:password])).to eq(false)
      expect(json.to_json).to include(PasswordResets::Update::OLD_TOKEN)
    end

    it "handles bad emails" do
      result = PasswordResets::Create.run(email: "bad@wrong.com")
      expect(result.errors["email"].message).to eq("Email not found")
    end
  end
end
