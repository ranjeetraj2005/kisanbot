module Users
  class Create < Mutations::Command
    include Auth::ConsentHelpers
    CANT_USE_SERVER = "You are not authorized to use this server. " \
                      "Please use an official email address."
    ALREADY_REGISTERED = "Already registered"
    PW_MISMATCH = "Password and confirmation do not match."

    required do
      string :name
      string :email
      string :password
      string :password_confirmation
    end

    optional do
      boolean :agree_to_terms
      boolean :skip_email, default: User::SKIP_EMAIL_VALIDATION
    end

    def validate
      maybe_validate_tos
      maybe_check_email_domain
      email.downcase!
      add_error :email, :*, ALREADY_REGISTERED if User.find_by(email: email)
      if password != password_confirmation
        add_error :password, :*, PW_MISMATCH
      end
    end

    def execute
      params = { email: email,
                 password: password,
                 password_confirmation: password_confirmation,
                 name: name }
      params[:agreed_to_terms_at] = Time.now
      user = User.new(params)
      device = Devices::Create.run!(user: user)
      user.save!
      UserMailer
        .welcome_email(user)
        .deliver_later unless skip_email
      { message: "Check your email!" }
    end

    def allowed_domains
      @allowed_domains ||= ENV["TRUSTED_DOMAINS"].split(",").map(&:strip)
    end

    def actual_domain
      @actual_domain ||= email.split("@").last
    end

    def domain_is_ok?
      ENV["TRUSTED_DOMAINS"] ? allowed_domains.include?(actual_domain) : true
    end

    def you_cant_use_this_server
      add_error :email, :email, CANT_USE_SERVER
    end

    def maybe_check_email_domain
      you_cant_use_this_server unless domain_is_ok?
    end
  end
end
