# frozen_string_literal: true

# Normalises a "JSON-ish" column into a plain Ruby value.
#
# The same column is an already-decoded Array/Hash when the migration used a
# `json` type and a raw String when it used `text`. Every serializer and the
# card catalog carried its own `is_a?(String) ? JSON.parse(...) : Array(...)`
# with an inline `rescue JSON::ParserError`; this is that logic, once.
module JsonColumn
  # Returns the decoded value, or `[]` when it cannot be decoded.
  def self.parse(value)
    return value if value.is_a?(Array) || value.is_a?(Hash)

    JSON.parse(value.to_s)
  rescue JSON::ParserError
    []
  end
end
